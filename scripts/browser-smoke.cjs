/* End-to-end browser smoke and visual snapshots.
 * Uses only the public static site, synthetic browser state and test navigation.
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const errors=[];

(async () => {
 const browser = await chromium.launch({headless:true,args:[
   '--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader',
   '--disable-dev-shm-usage'
 ]});
 try {
   for (const size of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]) {
     const context = await browser.newContext({viewport:{width:size.width,height:size.height},
       deviceScaleFactor:1,reducedMotion:'reduce'});
     const page = await context.newPage();
     page.on('pageerror',error=>errors.push(size.name+': '+error.message));
     page.on('console',msg=>{if(msg.type()==='error')errors.push(size.name+' console: '+msg.text());});
     page.on('requestfailed',request=>errors.push(size.name+' request: '+request.url()+' '+request.failure()?.errorText));
     await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
     await page.waitForFunction(() => !document.getElementById('boot') || document.getElementById('boot').classList.contains('loaded'),null,{timeout:45000});
     const failure=await page.locator('#errorScreen').isVisible();
     if(failure){await page.screenshot({path:'qa-error-'+size.name+'.png'});throw new Error('3D renderer startup failure: '+await page.locator('#errorText').innerText()+' / '+errors.join(' | '));}
     const skyResponse=await page.request.get('http://127.0.0.1:8765/assets/gaia-sky.jpg');
     assert.equal(skyResponse.status(),200,'ESA Gaia sky texture must be packaged');
     const skyBytes=await skyResponse.body();
     assert.ok(skyBytes.length>40000,'Gaia image must not be a broken placeholder');
     const starsResponse=await page.request.get('http://127.0.0.1:8765/data/bright-stars.json');
     assert.equal(starsResponse.status(),200,'HYG bright star catalog must be packaged');
     const stars=await starsResponse.json();
     assert.equal(stars.source,'HYG v4.1');
     assert.ok(stars.stars.length>10000,'Real magnitude-limited catalog must be present');
     await page.waitForTimeout(1900);
     await page.screenshot({path:'qa-'+size.name+'-hero.png',timeout:30000});
     const heading=await page.locator('#intro h1').innerText();
     assert.ok(heading.toLowerCase().includes('solar system'),'Concise welcome heading must appear');
     await page.locator('#planetList [data-destination="earth"]').click();
     await page.locator('#detailName').waitFor({state:'visible',timeout:30000});
     assert.equal((await page.locator('#detailName').innerText()).trim(),'EARTH');
     assert.equal(await page.locator('#intro').isVisible(),false,'Welcome copy should not cover a selected planet');
     assert.equal(await page.locator('#planetLabels').isVisible(),false,'Other planet labels should not cover close-ups');
     assert.equal(await page.locator('#detailDescription').isVisible(),false,'Long facts collapsed until requested');
     await page.locator('#detailsToggle').click();
     assert.equal(await page.locator('#detailDescription').isVisible(),true,'Visitor can expand detailed facts');
     await page.locator('#detailsToggle').click();
     assert.equal(await page.locator('#detailDescription').isVisible(),false,'Visitor can hide detailed facts');
     await page.waitForTimeout(1900);
     await page.screenshot({path:'qa-'+size.name+'-earth.png',timeout:30000});
     await page.locator('#cinemaButton').click();
     assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('cinema-mode')),true,'Distraction-free mode on');
     assert.equal(await page.locator('.bottom-panel').isVisible(),false,'Cinema mode hides controls');
     await page.keyboard.press('Escape');
     assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('cinema-mode')),false,'Escape exits cinema mode');
     await page.locator('#settingsButton').click();
     await page.locator('#lightingToggle').uncheck();
     await page.locator('#lightingToggle').check();
     await page.locator('#skyMode').selectOption('scientific');
     assert.equal(await page.locator('#skyMode').inputValue(),'scientific');
     await page.locator('#skyMode').selectOption('cinematic');
     assert.equal(await page.locator('#skyMode').inputValue(),'cinematic');
     await page.locator('#settingsClose').click();
     await page.locator('#backButton').click();
     assert.equal(await page.locator('#intro').isVisible(),false,'Welcome copy stays gone after visiting a planet');
     await page.waitForTimeout(1900);
     await page.screenshot({path:'qa-'+size.name+'.png',timeout:30000});
     console.log('PASSED '+size.name+' WebGL startup, navigation, layout');
     await context.close();
   }
   assert.equal(errors.length,0,errors.join('\n'));
 }finally{await browser.close();}
})().catch(e=>{console.error('Browser errors:',errors.join(' | '));console.error(e);process.exitCode=1;});

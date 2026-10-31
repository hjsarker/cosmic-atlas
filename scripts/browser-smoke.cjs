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
     await page.waitForTimeout(1900);
     await page.screenshot({path:'qa-'+size.name+'-hero.png',timeout:30000});
     const heading=await page.locator('#intro h1').innerText();
     assert.ok(heading.includes('UNIVERSE'),'Hero heading must appear');
     await page.locator('#planetList [data-destination="earth"]').click();
     await page.locator('#detailName').waitFor({state:'visible',timeout:30000});
     assert.equal((await page.locator('#detailName').innerText()).trim(),'EARTH');
     await page.waitForTimeout(1900);
     await page.screenshot({path:'qa-'+size.name+'-earth.png',timeout:30000});
     await page.locator('#backButton').click();
     await page.locator('#intro').waitFor({state:'visible',timeout:15000});
     await page.waitForTimeout(1900);
     await page.screenshot({path:'qa-'+size.name+'.png',timeout:30000});
     console.log('PASSED '+size.name+' WebGL startup, navigation, layout');
     await context.close();
   }
   assert.equal(errors.length,0,errors.join('\n'));
 }finally{await browser.close();}
})().catch(e=>{console.error('Browser errors:',errors.join(' | '));console.error(e);process.exitCode=1;});

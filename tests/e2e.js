const puppeteer=require('puppeteer-core');
(async()=>{
 const log=(...a)=>console.log(...a);
 const b=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:require('path').join(require('os').tmpdir(),'e2e-chrome-'+Date.now())});
 const p=await b.newPage();
 p.on('console',async m=>{if(['error','warning'].includes(m.type())){const parts=await Promise.all(m.args().map(a=>a.evaluate(v=>v instanceof Error?v.message:String(v)).catch(()=>'?')));log('CONSOLE',m.type(),(parts.join(' ')||m.text()).slice(0,200))}});
 p.on('pageerror',e=>log('PAGEERROR',e.message.slice(0,200)));
 p.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon'))log('HTTP',r.status(),r.request().method(),r.url().replace('http://localhost:5173',''))});
 p.setDefaultTimeout(5000);
 const t=id=>`[data-testid="${id}"]`;
 const step=async(name,fn)=>{try{await fn();log('PASS',name)}catch(e){log('FAIL',name,'->',e.message.split('\n')[0].slice(0,200));log('  PAGE TEXT:',(await p.evaluate(()=>document.body.innerText)).replace(/\s+/g,' ').slice(0,400));await b.close();process.exit(0)}};
 const count=async id=>(await p.$$(t(id))).length;
 await p.goto('http://localhost:5173/',{waitUntil:'networkidle0'});
 const title='سيارة اختبار '+Date.now()%10000;
 await step('home shows ad list + filters',async()=>{await p.waitForSelector(t('ad-list'));await p.waitForSelector(t('filter-category'));await p.waitForSelector(t('filter-city'));await p.waitForSelector(t('search-input'))});
 await step('logged out: post-ad asks to login',async()=>{await p.click(t('post-ad-button'));await p.waitForSelector(t('auth-email'))});
 await step('register',async()=>{await p.click(t('auth-toggle'));await p.waitForSelector(t('auth-name'));await p.type(t('auth-name'),'أحمد');await p.type(t('auth-email'),'s'+Date.now()+'@test.com');await p.type(t('auth-password'),'password123');await p.click(t('auth-submit'));await p.waitForSelector(t('user-name'))});
 await step('open post-ad form',async()=>{if(!await count('ad-title'))await p.click(t('post-ad-button'));await p.waitForSelector(t('ad-title'))});
 await step('validation error shown',async()=>{await p.type(t('ad-title'),'ab');await p.click(t('submit-ad'));await p.waitForSelector(t('error-message'))});
 await step('post valid ad',async()=>{await p.click(t('ad-title'),{clickCount:3});await p.keyboard.press('Backspace');await p.type(t('ad-title'),title);await p.type(t('ad-description'),'وصف تجريبي نظيف');await p.type(t('ad-price'),'42000');
   await p.select(t('ad-category'),await p.$eval(t('ad-category'),s=>[...s.options].find(o=>o.textContent.includes('سيارات')).value));
   await p.select(t('ad-city'),await p.$eval(t('ad-city'),s=>[...s.options].find(o=>o.textContent.includes('جدة')).value));
   if(await count('ad-seller'))await p.type(t('ad-seller'),'أحمد');await p.type(t('ad-phone'),'0501234567');const fi=await p.$(t('ad-image-input'));if(!fi)throw new Error('no ad-image-input');await fi.uploadFile(require('path').join(__dirname,'test.png'));await p.click(t('submit-ad'));
   await p.waitForFunction(s=>document.body.innerText.includes(s),{},title)});
 await step('posted ad shows image',async()=>{await p.waitForFunction(()=>{const i=document.querySelector('[data-testid="ad-image"]');return i&&i.complete&&i.naturalWidth>0},{timeout:8000})});
 await step('my ads page lists my ad with views',async()=>{await p.click(t('nav-my-ads'));await p.waitForFunction(s=>[...document.querySelectorAll('[data-testid="my-ad"]')].some(e=>e.textContent.includes(s)&&/مشاهد/.test(e.textContent)),{},title)});
 await step('back to list, ad visible',async()=>{if(await count('back'))await p.click(t('back'));await p.waitForFunction(s=>[...document.querySelectorAll('[data-testid="ad-card"]')].some(e=>e.textContent.includes(s)),{},title)});
 await step('search filters list',async()=>{await p.type(t('search-input'),title.split(' ').pop());await new Promise(r=>setTimeout(r,1500));if(await count('search-button'))await p.click(t('search-button'));await p.waitForFunction(s=>{const c=[...document.querySelectorAll('[data-testid="ad-card"]')];return c.length>=1&&c.every(e=>e.textContent.includes(s))},{},title)});
 await step('city filter excludes (الرياض)',async()=>{await p.click(t('search-input'),{clickCount:3});await p.keyboard.press('Backspace');if(await count('search-button'))await p.click(t('search-button'));
   await p.select(t('filter-city'),await p.$eval(t('filter-city'),s=>[...s.options].find(o=>o.textContent.includes('الرياض')).value));await new Promise(r=>setTimeout(r,1500));
   const has=await p.evaluate(s=>[...document.querySelectorAll('[data-testid="ad-card"]')].some(e=>e.textContent.includes(s)),title);if(has)throw new Error('ad from جدة still shown under الرياض filter')});
 await step('open ad detail',async()=>{await p.select(t('filter-city'),'');await new Promise(r=>setTimeout(r,1500));const cards=await p.$$(t('ad-card'));for(const c of cards){if((await c.evaluate(e=>e.textContent)).includes(title)){const btn=await c.$('button');await (btn||c).click();break}}
   await p.waitForSelector(t('ad-detail'));await p.waitForFunction(()=>document.querySelector('[data-testid="ad-detail"]').innerText.includes('0501234567')).catch(()=>{});const txt=await p.$eval(t('ad-detail'),e=>e.innerText);for(const w of ['0501234567','42000','جدة','سيارات'])if(!txt.replace(/[,٬]/g,'').includes(w))throw new Error('detail missing '+w)});
 await step('own ad shows delete, deleting removes it',async()=>{await p.waitForSelector(t('delete-ad'));p.on('dialog',d=>d.accept());await p.click(t('delete-ad'));await new Promise(r=>setTimeout(r,1500));
   if(await count('back')&&await count('ad-detail'))await p.click(t('back'));await p.waitForSelector(t('ad-list'));await new Promise(r=>setTimeout(r,1000));
   const still=await p.evaluate(s=>[...document.querySelectorAll('[data-testid="ad-card"]')].some(e=>e.textContent.includes(s)),title);if(still)throw new Error('deleted ad still listed')});
 await step('other ad hides delete',async()=>{const c=(await p.$$(t('ad-card')))[0];const btn=await c.$('button');await (btn||c).click();await p.waitForSelector(t('ad-detail'));await new Promise(r=>setTimeout(r,1000));if(await count('delete-ad'))throw new Error('delete-ad visible on an ad I did not post')}); await p.screenshot({path:require('path').join(__dirname,'sooq-e2e.png'),fullPage:true});
 log('ALL PASSED');await b.close();
})();









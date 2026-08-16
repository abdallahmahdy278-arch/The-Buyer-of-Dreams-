const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'a1572020';
const DATA_DIR = path.join(__dirname, 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const sessions = new Set();

app.use(express.json({limit:'5mb'}));
app.use(express.urlencoded({extended:true}));
app.use(express.static(__dirname));

function id(){return crypto.randomBytes(12).toString('hex')}
function ensure(){
  if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true});
  if(!fs.existsSync(CONTENT_FILE)) fs.writeFileSync(CONTENT_FILE,JSON.stringify({
    home:{mainQuote:'أنا لا أكتب لأُقال إنني كتبت، بل أكتب لأن في القلب كلامًا إن لم يخرج اختنق.',introText:'هذا فضاء أدبي شخصي يضم الكتاب والقصائد والمقتطفات.',heroImage:'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop',featuredExcerpt:'في بعض الأرواح نافذة صغيرة، تطل منها القصيدة كلما أغلقت الحياة أبوابها.'},
    book:{title:'كتاب بائعة الأحلام',description:'نبذة مختصرة عن الكتاب تُكتب من لوحة الإدارة.',coverImage:'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=900&auto=format&fit=crop',printLink:'',pdfLink:'',chapters:[]},
    poems:[],quotes:[],about:{bio:''},socials:{facebook:'',instagram:'',youtube:''},style:{primary:'#8B0000',gold:'#D4AF37',bodyFont:'Tajawal',titleFont:'Aref Ruqaa',bodySize:18,titleSize:36}
  },null,2));
  if(!fs.existsSync(MESSAGES_FILE)) fs.writeFileSync(MESSAGES_FILE,JSON.stringify({messages:[]},null,2));
}
function read(f){return JSON.parse(fs.readFileSync(f,'utf8'))}
function write(f,d){fs.writeFileSync(f,JSON.stringify(d,null,2),'utf8')}
function auth(req,res,next){const t=(req.headers.authorization||'').replace(/^Bearer\s+/i,'').trim();if(!t||!sessions.has(t))return res.status(401).json({message:'انتهت جلسة الدخول أو غير مصرح'});next()}
function yt(url){try{const u=new URL(url);if(u.hostname.includes('youtu.be'))return `https://www.youtube.com/embed/${u.pathname.slice(1).split('/')[0]}`;if(u.hostname.includes('youtube.com')){const v=u.searchParams.get('v');return v?`https://www.youtube.com/embed/${v}`:'';}}catch(e){}return ''}
ensure();

app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.get('/admin',(req,res)=>res.sendFile(path.join(__dirname,'admin.html')));
app.get('/api/content',(req,res)=>res.json(read(CONTENT_FILE)));

app.post('/api/admin/login',(req,res)=>{if(req.body.password!==ADMIN_PASSWORD)return res.status(401).json({message:'كلمة المرور غير صحيحة'});const token=id();sessions.add(token);res.json({token,message:'تم تسجيل الدخول بنجاح'});});
app.post('/api/admin/logout',auth,(req,res)=>{const t=(req.headers.authorization||'').replace(/^Bearer\s+/i,'').trim();sessions.delete(t);res.json({message:'تم تسجيل الخروج'});});
app.get('/api/admin/messages',auth,(req,res)=>res.json(read(MESSAGES_FILE)));

app.post('/api/admin/update',(req,res)=>{ // intentionally authenticated below
  const t=(req.headers.authorization||'').replace(/^Bearer\s+/i,'').trim(); if(!sessions.has(t)) return res.status(401).json({message:'غير مصرح'});
  const {section,payload}=req.body; const d=read(CONTENT_FILE); if(!section||!payload||typeof payload!=='object')return res.status(400).json({message:'بيانات غير صحيحة'}); d[section]={...(d[section]||{}),...payload}; write(CONTENT_FILE,d);res.json({message:'تم الحفظ'});
});

app.post('/api/admin/book/chapters',auth,(req,res)=>{const d=read(CONTENT_FILE);d.book=d.book||{};d.book.chapters=d.book.chapters||[];const {id,title,content,youtubeUrl}=req.body;if(!title||!content)return res.status(400).json({message:'عنوان الفصل والنص مطلوبان'});const item={id:id||idGen(),title,content,youtubeUrl:youtubeUrl||'',embedUrl:yt(youtubeUrl||'')};const i=d.book.chapters.findIndex(x=>x.id===id);if(i>=0)d.book.chapters[i]=item;else d.book.chapters.push(item);write(CONTENT_FILE,d);res.json({message:'تم حفظ الفصل'});});
function idGen(){return id()}
app.delete('/api/admin/book/chapters/:id',auth,(req,res)=>{const d=read(CONTENT_FILE);d.book.chapters=(d.book.chapters||[]).filter(x=>x.id!==req.params.id);write(CONTENT_FILE,d);res.json({message:'تم حذف الفصل'});});

app.post('/api/admin/poems',auth,(req,res)=>{const d=read(CONTENT_FILE);d.poems=d.poems||[];const {id,title,type,reason,content,font,size,color}=req.body;if(!title||!content)return res.status(400).json({message:'اسم القصيدة والنص مطلوبان'});const item={id:id||idGen(),title,type:type||'حر',reason:reason||'',content,font:font||'Amiri',size:Number(size)||22,color:color||'#2a2521'};const i=d.poems.findIndex(x=>x.id===id);if(i>=0)d.poems[i]=item;else d.poems.push(item);write(CONTENT_FILE,d);res.json({message:'تم حفظ القصيدة'});});
app.delete('/api/admin/poems/:id',auth,(req,res)=>{const d=read(CONTENT_FILE);d.poems=(d.poems||[]).filter(x=>x.id!==req.params.id);write(CONTENT_FILE,d);res.json({message:'تم حذف القصيدة'});});

app.post('/api/admin/quotes',auth,(req,res)=>{const d=read(CONTENT_FILE);d.quotes=d.quotes||[];const {id,title,text,font,size,color}=req.body;if(!text)return res.status(400).json({message:'النص مطلوب'});const item={id:id||idGen(),title:title||'مقتطف شعري',text,font:font||'Amiri',size:Number(size)||24,color:color||'#2a2521'};const i=d.quotes.findIndex(x=>x.id===id);if(i>=0)d.quotes[i]=item;else d.quotes.push(item);write(CONTENT_FILE,d);res.json({message:'تم حفظ المقتطف'});});
app.delete('/api/admin/quotes/:id',auth,(req,res)=>{const d=read(CONTENT_FILE);d.quotes=(d.quotes||[]).filter(x=>x.id!==req.params.id);write(CONTENT_FILE,d);res.json({message:'تم حذف المقتطف'});});

app.post('/api/admin/contact-message', (req,res)=>{const {message}=req.body;if(!message||!String(message).trim())return res.status(400).json({message:'اكتب الرسالة أولاً'});const d=read(MESSAGES_FILE);d.messages.unshift({id:id(),message:String(message).trim(),createdAt:new Date().toISOString(),anonymous:true});write(MESSAGES_FILE,d);res.json({message:'تم إرسال الرسالة إلى مشتري الأحلام'});});
app.post('/api/admin/media',auth,(req,res)=>{const d=read(CONTENT_FILE);d.media=d.media||[];const {id,title,type,url}=req.body;if(!url)return res.status(400).json({message:'الرابط مطلوب'});const item={id:id||idGen(),title:title||'',type:type||'youtube',url,embedUrl:type==='youtube'?yt(url):''};const i=d.media.findIndex(x=>x.id===id);if(i>=0)d.media[i]=item;else d.media.push(item);write(CONTENT_FILE,d);res.json({message:'تم حفظ الوسيط'});});
app.delete('/api/admin/media/:id',auth,(req,res)=>{const d=read(CONTENT_FILE);d.media=(d.media||[]).filter(x=>x.id!==req.params.id);write(CONTENT_FILE,d);res.json({message:'تم حذف الوسيط'});});

app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));

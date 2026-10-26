import { PDFDocument, StandardFonts } from 'pdf-lib';
import type { LegalDoc } from './client-contracts';
export async function digest(bytes: Uint8Array | string) { const b=typeof bytes==='string'?new TextEncoder().encode(bytes):bytes;return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(n=>n.toString(16).padStart(2,'0')).join(''); }
export async function documentPdf(legal:LegalDoc,annex?:Uint8Array,evidence?:string[]) {
 const pdf=await PDFDocument.create(); const font=await pdf.embedFont(StandardFonts.Helvetica); let page=pdf.addPage();let y=790;
 const lines=[legal.title,...legal.preamble,...legal.sections.flatMap(s=>[s.title,...s.paragraphs]),...legal.closing,...(evidence??[])];
 for(const text of lines) {
  let line=''; const clean=text.replace(/[^\x20-\x7E\xA0-\xFF\u2013\u2014\u2018\u2019\u201C\u201D]/g,' ');
  const draw=()=>{if(y<55){page=pdf.addPage();y=790;}page.drawText(line,{x:45,y,size:10,font});y-=15;line='';};
  for(const word of clean.split(/\s+/)){if(font.widthOfTextAtSize(`${line} ${word}`,10)>500&&line) draw();line+=(line?' ':'')+word;} if(line)draw(); y-=10;
 }
 if(annex){const a=await PDFDocument.load(annex);for(const p of await pdf.copyPages(a,a.getPageIndices()))pdf.addPage(p);}
 return new Uint8Array(await pdf.save());
}

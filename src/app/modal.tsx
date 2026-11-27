'use client';
import { useEffect, useRef, type ReactNode } from 'react';
export function Modal({children,label,onClose}:{children:ReactNode;label:string;onClose:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const element=ref.current,previous=document.activeElement as HTMLElement|null;
    element?.showModal();
    const trap=(event:KeyboardEvent)=>{
      if(event.key!=='Tab'||!element)return;
      const controls=Array.from(element.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')).filter(el=>el.getClientRects().length>0);
      const first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    };
    element?.addEventListener('keydown',trap);
    return()=>{element?.removeEventListener('keydown',trap);element?.close();previous?.focus();};
  },[]);
  return <dialog ref={ref} className="modal native-modal" aria-label={label} onCancel={event=>{event.preventDefault();onClose();}}>{children}</dialog>;
}

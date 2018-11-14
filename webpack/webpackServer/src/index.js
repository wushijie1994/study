/*console.log(`test01`);
console.log(`test02`);
console.log(`test03`);
console.log(`test03`);
console.log(`test04`);
console.log(`test05`);*/

let dom=document.querySelector('#message');
let message='';
for(let i=0;i<6;i++){
    message+='test'+i;
}
dom.innerText=message;
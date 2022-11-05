//-------------------------------------------------------------------
export function unixTimestamp(): number
{  
	return Math.floor(Date.now() / 1000);
}

//-------------------------------------------------------------------
export async function asyncwait(ms: number) 
{
	return new Promise(resolve => {
	   setTimeout(() => { resolve(ms);}, ms);
   });
}
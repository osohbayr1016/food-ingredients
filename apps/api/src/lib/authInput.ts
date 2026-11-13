export function parseCredentials(raw:unknown){
 if(!raw || typeof raw!=="object" || Array.isArray(raw))return null;
 const input=raw as Record<string,unknown>;
 if(typeof input.username!=="string"||typeof input.password!=="string")return null;
 const username=input.username.trim();
 const password=input.password;
 if(username.length>32 || password.length>256 || !password) return null;
 return {username,password};
}

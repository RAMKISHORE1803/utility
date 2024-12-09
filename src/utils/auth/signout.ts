
import { supabase } from "./connect";

export default async function GoogleSignOut(){
    const {data,error} = await supabase.auth.getUser();
    console.log(data.user?.email);
    await supabase.auth.signOut();
    if(error) return error;
}
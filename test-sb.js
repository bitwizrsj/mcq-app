const { createClient } = require('@supabase/supabase-js');

const url = "https://ulzhgbujdcfytbxvuyaa.supabase.co";
const key = "sb_publishable_Z8AxtFQz4FyxadKst9uwPg_KVu-eCOn";

const supabase = createClient(url, key);

async function test() {
  console.log("Testing project creation...");
  const { data, error } = await supabase.from('projects').insert([{ name: "Test" }]).select();
  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log("Success:", data);
  }
}

test();

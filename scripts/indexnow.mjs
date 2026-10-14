// Avisa a Bing, Yandex y demás buscadores de IndexNow de todas las URLs del
// sitemap para que las rastreen ya (Google no usa IndexNow: para Google
// está el sitemap en Search Console). Uso: npm run indexnow
// La clave tiene que estar publicada en https://www.nutriyuly.com/<clave>.txt
const KEY = "d38f4d0645d489081e3ef855288504e2";
const SITE = "https://www.nutriyuly.com";

const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urls.length === 0) throw new Error("El sitemap no tiene URLs");

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow: ${urls.length} URLs enviadas → ${res.status} ${res.statusText}`);
if (!res.ok) process.exitCode = 1;

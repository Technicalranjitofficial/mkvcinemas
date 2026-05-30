/**
 * MKVCinemas Auto-Import Bot
 * Run: node --env-file=.env scripts/auto-import.mjs  |  or: yarn bot
 * Scheduled: .github/workflows/auto-import.yml (daily 2 AM UTC)
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TMDB_BASE   = 'https://api.themoviedb.org/3';
const TMDB_KEY    = process.env.TMDB_API_KEY;
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const RATE_MS     = 280;

// Language → site category
const LANG_CATEGORY = {
  hi:'Bollywood', bho:'Bollywood', mr:'Bollywood', pa:'Bollywood',
  gu:'Bollywood', ur:'Bollywood',  bn:'Bollywood', as:'Bollywood',
  mai:'Bollywood',raj:'Bollywood', si:'Bollywood', dz:'Bollywood',
  ne:'Nepali',
  ta:'South Indian', te:'South Indian', ml:'South Indian',
  kn:'South Indian', or:'South Indian',
  en:'Hollywood', fr:'Hollywood', de:'Hollywood', es:'Hollywood',
  ja:'Hollywood', ko:'Hollywood', zh:'Hollywood', it:'Hollywood',
  pt:'Hollywood', ru:'Hollywood', tr:'Hollywood', ar:'Hollywood',
  th:'Hollywood', id:'Hollywood',
};

const MOVIE_GENRE_MAP = {
  28:'Action',12:'Action',16:'Comedy',35:'Comedy',80:'Thriller',
  99:'Drama',18:'Drama',10751:'Drama',14:'Drama',36:'Drama',
  27:'Horror',10402:'Drama',9648:'Thriller',10749:'Drama',
  878:'Action',10770:'Drama',53:'Thriller',10752:'Action',37:'Action',
};

const TV_GENRE_MAP = {
  10759:'Action',16:'Comedy',35:'Comedy',80:'Thriller',99:'Drama',
  18:'Drama',10751:'Drama',10762:'Drama',9648:'Thriller',10763:'Drama',
  10764:'Drama',10765:'Action',10766:'Drama',10767:'Drama',
  10768:'Action',37:'Action',
};

const SOURCES = [
  // Global movie charts
  {label:'Trending Movies/Day',  path:'/trending/movie/day',  pages:2},
  {label:'Trending Movies/Week', path:'/trending/movie/week', pages:3},
  {label:'Now Playing',          path:'/movie/now_playing',   pages:3},
  {label:'Upcoming',             path:'/movie/upcoming',      pages:3},
  {label:'Popular Movies',       path:'/movie/popular',       pages:5},
  {label:'Top Rated Movies',     path:'/movie/top_rated',     pages:5},
  // Hindi / Bollywood
  {label:'Hindi 2026',path:'/discover/movie',pages:4,params:{with_original_language:'hi',primary_release_year:'2026',sort_by:'popularity.desc'}},
  {label:'Hindi 2025',path:'/discover/movie',pages:4,params:{with_original_language:'hi',primary_release_year:'2025',sort_by:'popularity.desc'}},
  {label:'Hindi 2024',path:'/discover/movie',pages:3,params:{with_original_language:'hi',primary_release_year:'2024',sort_by:'popularity.desc'}},
  {label:'Hindi 2023',path:'/discover/movie',pages:2,params:{with_original_language:'hi',primary_release_year:'2023',sort_by:'popularity.desc'}},
  // Bhojpuri
  {label:'Bhojpuri',path:'/discover/movie',pages:3,params:{with_original_language:'bho',sort_by:'popularity.desc'}},
  // Marathi
  {label:'Marathi',path:'/discover/movie',pages:3,params:{with_original_language:'mr',sort_by:'popularity.desc'}},
  // Bengali (Tollywood)
  {label:'Bengali',path:'/discover/movie',pages:3,params:{with_original_language:'bn',sort_by:'popularity.desc'}},
  // Punjabi
  {label:'Punjabi',path:'/discover/movie',pages:3,params:{with_original_language:'pa',sort_by:'popularity.desc'}},
  // Gujarati
  {label:'Gujarati',path:'/discover/movie',pages:2,params:{with_original_language:'gu',sort_by:'popularity.desc'}},
  // Urdu (Pakistani cinema)
  {label:'Urdu',path:'/discover/movie',pages:2,params:{with_original_language:'ur',sort_by:'popularity.desc'}},
  // Nepali
  {label:'Nepali',path:'/discover/movie',pages:3,params:{with_original_language:'ne',sort_by:'popularity.desc'}},
  // Tamil
  {label:'Tamil 2026',path:'/discover/movie',pages:3,params:{with_original_language:'ta',primary_release_year:'2026',sort_by:'popularity.desc'}},
  {label:'Tamil 2025',path:'/discover/movie',pages:3,params:{with_original_language:'ta',primary_release_year:'2025',sort_by:'popularity.desc'}},
  {label:'Tamil 2024',path:'/discover/movie',pages:2,params:{with_original_language:'ta',primary_release_year:'2024',sort_by:'popularity.desc'}},
  // Telugu
  {label:'Telugu 2026',path:'/discover/movie',pages:3,params:{with_original_language:'te',primary_release_year:'2026',sort_by:'popularity.desc'}},
  {label:'Telugu 2025',path:'/discover/movie',pages:3,params:{with_original_language:'te',primary_release_year:'2025',sort_by:'popularity.desc'}},
  {label:'Telugu 2024',path:'/discover/movie',pages:2,params:{with_original_language:'te',primary_release_year:'2024',sort_by:'popularity.desc'}},
  // Malayalam
  {label:'Malayalam 2026',path:'/discover/movie',pages:3,params:{with_original_language:'ml',primary_release_year:'2026',sort_by:'popularity.desc'}},
  {label:'Malayalam 2025',path:'/discover/movie',pages:3,params:{with_original_language:'ml',primary_release_year:'2025',sort_by:'popularity.desc'}},
  // Kannada
  {label:'Kannada 2026',path:'/discover/movie',pages:3,params:{with_original_language:'kn',primary_release_year:'2026',sort_by:'popularity.desc'}},
  {label:'Kannada 2025',path:'/discover/movie',pages:2,params:{with_original_language:'kn',primary_release_year:'2025',sort_by:'popularity.desc'}},
  // Odia
  {label:'Odia',path:'/discover/movie',pages:2,params:{with_original_language:'or',sort_by:'popularity.desc'}},
  // Hollywood by year
  {label:'Hollywood 2026',path:'/discover/movie',pages:5,params:{with_original_language:'en',primary_release_year:'2026',sort_by:'popularity.desc'}},
  {label:'Hollywood 2025',path:'/discover/movie',pages:5,params:{with_original_language:'en',primary_release_year:'2025',sort_by:'popularity.desc'}},
  {label:'Hollywood 2024',path:'/discover/movie',pages:3,params:{with_original_language:'en',primary_release_year:'2024',sort_by:'popularity.desc'}},
  // ── TV / Web Series ──────────────────────────────────────────────────────
  {label:'Trending TV/Day',  path:'/trending/tv/day',  pages:2,isTV:true},
  {label:'Trending TV/Week', path:'/trending/tv/week', pages:3,isTV:true},
  {label:'TV On Air',        path:'/tv/on_the_air',    pages:3,isTV:true},
  {label:'TV Popular',       path:'/tv/popular',       pages:5,isTV:true},
  {label:'TV Top Rated',     path:'/tv/top_rated',     pages:5,isTV:true},
  {label:'Hindi TV 2026',path:'/discover/tv',pages:3,isTV:true,params:{with_original_language:'hi',first_air_date_year:'2026',sort_by:'popularity.desc'}},
  {label:'Hindi TV 2025',path:'/discover/tv',pages:3,isTV:true,params:{with_original_language:'hi',first_air_date_year:'2025',sort_by:'popularity.desc'}},
  {label:'Tamil TV',    path:'/discover/tv',pages:3,isTV:true,params:{with_original_language:'ta',sort_by:'popularity.desc'}},
  {label:'Telugu TV',   path:'/discover/tv',pages:3,isTV:true,params:{with_original_language:'te',sort_by:'popularity.desc'}},
  {label:'Malayalam TV',path:'/discover/tv',pages:2,isTV:true,params:{with_original_language:'ml',sort_by:'popularity.desc'}},
  {label:'Kannada TV',  path:'/discover/tv',pages:2,isTV:true,params:{with_original_language:'kn',sort_by:'popularity.desc'}},
  {label:'Bengali TV',  path:'/discover/tv',pages:2,isTV:true,params:{with_original_language:'bn',sort_by:'popularity.desc'}},
  {label:'English TV 2026',path:'/discover/tv',pages:4,isTV:true,params:{with_original_language:'en',first_air_date_year:'2026',sort_by:'popularity.desc'}},
  {label:'English TV 2025',path:'/discover/tv',pages:4,isTV:true,params:{with_original_language:'en',first_air_date_year:'2025',sort_by:'popularity.desc'}},
];

async function tmdbGet(path,params={},attempt=1){
  const url=new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key',TMDB_KEY);
  for(const[k,v]of Object.entries(params))url.searchParams.set(k,v);
  try{
    const res=await fetch(url.toString(),{headers:{'User-Agent':'MKVCinemas-Bot/1.0','Accept':'application/json'}});
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    return res.json();
  }catch(err){
    if(attempt<3){const d=attempt*1500;console.log(`    ⚠  Retry ${attempt}/3 ${path} — ${err.message}`);await sleep(d);return tmdbGet(path,params,attempt+1);}
    throw new Error(`TMDB ${path}: ${err.message}`);
  }
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

async function fetchCandidates(){
  const seenMovies=new Set(),seenTV=new Set(),all=[];
  for(const src of SOURCES){
    const isTV=src.isTV??false,seen=isTV?seenTV:seenMovies,fetched=[];
    for(let p=1;p<=src.pages;p++){
      try{const d=await tmdbGet(src.path,{...(src.params??{}),page:String(p)});fetched.push(...(d.results??[]));await sleep(150);}
      catch(e){console.log(`    ⚠  ${src.label} p${p}: ${e.message}`);break;}
    }
    const uniq=fetched.filter(m=>{if(seen.has(m.id))return false;seen.add(m.id);return true;});
    console.log(`    ${(src.label+(isTV?' [TV]':'')).padEnd(28)} → ${String(fetched.length).padStart(3)} fetched, ${String(uniq.length).padStart(3)} new`);
    all.push(...uniq.map(m=>({id:m.id,title:m.title??m.name??'Unknown',isTV})));
  }
  return all;
}

async function fetchMovieDetails(id){
  const[details,credits]=await Promise.all([tmdbGet(`/movie/${id}`),tmdbGet(`/movie/${id}/credits`)]);
  const director=credits.crew?.find(c=>c.job==='Director')?.name??'';
  const cast=credits.cast?.slice(0,8).map(c=>c.name).join(', ')??'';
  return{details,director,cast};
}
async function fetchTvDetails(id){
  const[details,credits]=await Promise.all([tmdbGet(`/tv/${id}`),tmdbGet(`/tv/${id}/credits`)]);
  details.title=details.name??details.original_name;
  details.release_date=details.first_air_date;
  const director=credits.crew?.find(c=>['Director','Executive Producer','Creator'].includes(c.job))?.name??'';
  const cast=credits.cast?.slice(0,8).map(c=>c.name).join(', ')??'';
  return{details,director,cast};
}

function buildCategories(details,genreMap,extraCats=[]){
  const cats=new Set(extraCats);
  const lc=LANG_CATEGORY[details.original_language];
  if(lc)cats.add(lc);
  for(const g of details.genres??[]){const m=genreMap[g.id];if(m)cats.add(m);}
  if(cats.size===0)cats.add('Hollywood');
  return[...cats];
}

function audioLabel(lang){
  if(['hi','bho','ur'].includes(lang))return'Hindi';
  if(['ta','te','ml','kn','or'].includes(lang))return'Tamil/Telugu';
  const map={mr:'Marathi',pa:'Punjabi',bn:'Bengali',ne:'Nepali',gu:'Gujarati'};
  return map[lang]??'English';
}

async function main(){
  if(!TMDB_KEY){console.error('❌  TMDB_API_KEY not set.');process.exit(1);}
  console.log(`\n🎬  MKVCinemas Auto-Import Bot — ${new Date().toISOString()}\n${'─'.repeat(60)}`);

  console.log('📡  Fetching candidates…\n');
  const candidates=await fetchCandidates();
  const movies=candidates.filter(c=>!c.isTV),series=candidates.filter(c=>c.isTV);
  console.log(`\n    Unique candidates : ${candidates.length}  (${movies.length} movies + ${series.length} series)`);

  const existing=await prisma.movie.findMany({select:{tmdbId:true,categories:true}});
  const exMovies=new Set(existing.filter(r=>!r.categories?.includes('Web Series')).map(r=>r.tmdbId).filter(Boolean));
  const exTV=new Set(existing.filter(r=>r.categories?.includes('Web Series')).map(r=>r.tmdbId).filter(Boolean));
  console.log(`    DB already has : ${exMovies.size} movies + ${exTV.size} series\n`);

  const newItems=candidates.filter(c=>c.isTV?!exTV.has(String(c.id)):!exMovies.has(String(c.id)));
  const nm=newItems.filter(c=>!c.isTV).length,ns=newItems.filter(c=>c.isTV).length;
  console.log(`🆕  ${newItems.length} new items to import  (${nm} movies + ${ns} series).\n`);
  if(!newItems.length){console.log('✅  Nothing new today.\n');return;}

  let added=0,skipped=0,failed=0;
  for(const item of newItems){
    try{
      await sleep(RATE_MS);
      const{details,director,cast}=item.isTV?await fetchTvDetails(item.id):await fetchMovieDetails(item.id);
      if(!details.poster_path||!details.overview?.trim()){console.log(`⏭   No poster/plot: ${details.title}`);skipped++;continue;}
      if(!details.release_date){console.log(`⏭   No release date: ${details.title}`);skipped++;continue;}
      const year=new Date(details.release_date).getFullYear();
      const genreMap=item.isTV?TV_GENRE_MAP:MOVIE_GENRE_MAP;
      const categories=buildCategories(details,genreMap,item.isTV?['Web Series']:[]);
      await prisma.movie.create({data:{
        title:details.title,year,
        rating:Math.round((details.vote_average??0)*10)/10,
        quality:'1080p',audio:audioLabel(details.original_language),size:'N/A',
        plot:details.overview,director,cast,
        posterUrl:`${POSTER_BASE}${details.poster_path}`,
        tmdbId:String(details.id),screenshots:[],categories,downloadLinks:[],streamLinks:[],
      }});
      added++;
      console.log(`${item.isTV?'📺':'🎬'} [${added}]  ${details.title} (${year}) — ${categories.join(', ')}`);
    }catch(err){failed++;console.error(`✗  ${item.title}: ${err.message}`);}
  }

  console.log(`\n${'─'.repeat(60)}\n🏁  Done!  Added: ${added}  Skipped: ${skipped}  Failed: ${failed}\n`);
}

main().catch(e=>{console.error('Fatal:',e);process.exit(1);}).finally(()=>prisma.$disconnect());

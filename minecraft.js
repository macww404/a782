'use strict';

const MODRINTH_API = "https://api.modrinth.com/v2";
const CURSEFORGE_API = "https://api.curseforge.com/v1";
const CURSEFORGE_MINECRAFT = 432;
const CURSEFORGE_LIMIT = 10000;
const PAGE_SIZE = 25;
const TYPE_INFO = {
  mod: {classId:6, cursePath:"mc-mods"},
  resourcepack: {classId:12, cursePath:"texture-packs"},
  modpack: {classId:4471, cursePath:"modpacks"},
  shader: {classId:6552, cursePath:"shaders"}
};
const LOADERS = {forge:1, fabric:4, quilt:5, neoforge:6, liteloader:3, cauldron:2};
const CURSEFORGE_SORT = {downloads:6, follows:2, newest:11, updated:3};
const SORTS = ["relevance","downloads","follows","newest","updated"];

function fail(status,code) {
  throw Object.assign(new Error(code),{status,code});
}
function text(value,max) { return typeof value==="string"?value.trim().slice(0,max):""; }
function list(value) { return Array.isArray(value)?value:[]; }
function count(value) { return Number.isFinite(value)?Math.max(0,Math.trunc(value)):0; }
function validType(value) { return Object.hasOwn(TYPE_INFO,value)?value:"mod"; }
function versionName(value) {
  return typeof value==="string"&&/^(?=.{1,40}$)(?=.*\d)[\w.+-]+$/.test(value);
}
function gameVersions(values) {
  return [...new Set(values.filter(versionName))].sort((a,b)=>b.localeCompare(a,"en",{numeric:true}));
}
function knownLoaders(values) {
  return [...new Set(values.map(value=>String(value||"").toLowerCase()).filter(value=>Object.hasOwn(LOADERS,value)))];
}
function httpsUrl(value,accept=()=>true) {
  if(typeof value!=="string" || !value)return "";
  try{
    const url=new URL(value);
    if(url.protocol==="https:" && !url.username && !url.password && accept(url.hostname,url))return url.href;
  }catch{}
  return "";
}
const onCurseForge = host=>host==="curseforge.com" || host.endsWith(".curseforge.com");
const onForgeCDN = host=>host==="forgecdn.net" || host.endsWith(".forgecdn.net");
const onModrinthCDN = host=>host==="cdn.modrinth.com";
function modrinthLink(type,slug) {
  return "https://modrinth.com/"+validType(type)+"/"+encodeURIComponent(slug);
}
function curseForgeLink(project,type) {
  const site=httpsUrl(project.links?.websiteUrl,(host,url)=>onCurseForge(host)&&url.pathname.startsWith("/minecraft/"));
  const slug=text(project.slug,80);
  return site || (slug?"https://www.curseforge.com/minecraft/"+TYPE_INFO[validType(type)].cursePath+"/"+encodeURIComponent(slug):"");
}
function projectFileLink(projectUrl,fileId) {
  if(!projectUrl)return "";
  const url=new URL(projectUrl);
  url.pathname=url.pathname.replace(/\/+$/,"")+"/files/"+encodeURIComponent(fileId);
  url.search="";
  url.hash="";
  return url.href;
}
function normalizePage(sp,source) {
  const value=sp.get("page")||"0";
  const page=Number(value);
  if(!/^\d+$/.test(value)||!Number.isSafeInteger(page)||page>100000)fail(400,"invalid");
  if(source==="curseforge" && page*PAGE_SIZE>=CURSEFORGE_LIMIT)fail(400,"mc_page_limit");
  return page;
}
function pageInfo(page,total,resultCount,source) {
  const limited=source==="curseforge" && total>=CURSEFORGE_LIMIT;
  const accessible=limited?Math.min(CURSEFORGE_LIMIT,total):total;
  return {page,size:PAGE_SIZE,total,limited,hasNext:resultCount>0&&(page+1)*PAGE_SIZE<accessible};
}
function filters(sp,source) {
  const type=validType(sp.get("type"));
  const loader=sp.get("loader")||"";
  const game=text(sp.get("version"),40);
  if(game&&!versionName(game))fail(400,"mc_invalid_version");
  return {
    source,type,game,page:normalizePage(sp,source),
    loader:["mod","modpack"].includes(type)&&Object.hasOwn(LOADERS,loader)?loader:""
  };
}
function sourceName(sp) {
  const source=sp.get("source")||"modrinth";
  if(source!=="modrinth" && source!=="curseforge")fail(400,"invalid");
  return source;
}

function normalizeModrinthVersion(version,project) {
  const files=list(version.files).map(file=>({
    name:text(file.filename,180),size:count(file.size),
    url:httpsUrl(file.url,onModrinthCDN),primary:file.primary===true
  })).filter(file=>file.url);
  files.sort((a,b)=>Number(b.primary)-Number(a.primary));
  const id=text(version.id,64);
  return {
    id, name:text(version.name,140)||text(version.version_number,80),
    number:text(version.version_number,80), games:gameVersions(list(version.game_versions)),
    loaders:knownLoaders(list(version.loaders)), downloads:count(version.downloads),
    channel:["release","beta","alpha"].includes(version.version_type)?version.version_type:"",
    files, file:files[0]?.url||"", sourceUrl:id?project.url+"/version/"+encodeURIComponent(id):project.url
  };
}
function curseFileGames(file) {
  return gameVersions([
    ...list(file.gameVersions),
    ...list(file.sortableGameVersions).map(version=>version.gameVersionName||version.gameVersion)
  ]);
}
function normalizeCurseVersion(file,project,requestedLoader) {
  const allowed=project.allowDirect&&file.isAvailable!==false&&!file.isEarlyAccessContent;
  const url=allowed?httpsUrl(file.downloadUrl,onForgeCDN):"";
  const name=text(file.fileName,180);
  const id=String(file.id||"");
  return {
    id, name:text(file.displayName,140)||name, number:name, games:curseFileGames(file),
    loaders:knownLoaders([...list(file.gameVersions),requestedLoader]), downloads:count(file.downloadCount),
    channel:({1:"release",2:"beta",3:"alpha"})[file.releaseType]||"",
    files:url?[{name,size:count(file.fileLength),url,primary:true}]:[],
    file:url, sourceUrl:projectFileLink(project.url,id)
  };
}

function createMinecraftCatalog({curseForgeKey="",userAgent,fetcher=globalThis.fetch}={}) {
  const sources={modrinth:true,curseforge:!!curseForgeKey};
  const cache=new Map();
  const pending=new Map();

  async function cached(key,load,ttl=300000) {
    const hit=cache.get(key);
    if(hit && hit.expires>Date.now()){
      cache.delete(key);
      cache.set(key,hit);
      return hit.value;
    }
    if(pending.has(key))return pending.get(key);
    const job=load().then(value=>{
      cache.set(key,{value,expires:Date.now()+ttl});
      if(cache.size>96)cache.delete(cache.keys().next().value);
      return value;
    }).finally(()=>pending.delete(key));
    pending.set(key,job);
    return job;
  }

  function requireSource(source) {
    if(source==="curseforge"&&!sources.curseforge)fail(503,"mc_provider_unconfigured");
  }

  async function request(source,path,params) {
    requireSource(source);
    const url=new URL((source==="curseforge"?CURSEFORGE_API:MODRINTH_API)+path);
    if(params)url.search=new URLSearchParams(params).toString();
    const headers={"Accept":"application/json","User-Agent":userAgent||"A782DIGITAL/3.0"};
    if(source==="curseforge")headers["x-api-key"]=curseForgeKey;
    let response;
    try {
      response=await fetcher(url.toString(),{headers,signal:AbortSignal.timeout(8000),redirect:"error"});
    } catch { fail(502,"upstream"); }
    if(response.status===404)fail(404,"mc_project_missing");
    if(response.status===429)fail(503,"mc_rate_limited");
    if(source==="curseforge"&&(response.status===401||response.status===403))fail(502,"mc_provider_auth");
    if(!response.ok)fail(502,"upstream");
    try{return await response.json()}catch{fail(502,"upstream")}
  }

  async function search(sp) {
    const source=sourceName(sp);
    requireSource(source);
    const {type,game,loader,page}=filters(sp,source);
    const q=text(sp.get("q"),80);
    const requestedSort=sp.get("sort");
    const sort=SORTS.includes(requestedSort)?requestedSort:"downloads";
    const offset=page*PAGE_SIZE;
    if(source==="modrinth"){
      const facets=[["project_type:"+type]];
      if(loader)facets.push(["categories:"+loader]);
      if(game)facets.push(["versions:"+game]);
      const params={query:q,facets:JSON.stringify(facets),index:sort,limit:PAGE_SIZE,offset};
      return cached("mr-search:"+JSON.stringify(params),async()=>{
        const data=await request(source,"/search",params);
        const hits=list(data.hits).map(hit=>({
          id:String(hit.project_id),source,type,title:text(hit.title,140),author:text(hit.author,90),
          desc:text(hit.description,360),icon:httpsUrl(hit.icon_url),downloads:count(hit.downloads),
          license:text(hit.license,50),games:gameVersions(list(hit.versions)),
          loaders:knownLoaders(list(hit.categories)),url:modrinthLink(type,hit.slug||hit.project_id)
        }));
        const total=Number.isFinite(data.total_hits)?count(data.total_hits):offset+hits.length;
        return {source,hits,pagination:pageInfo(page,total,hits.length,source)};
      });
    }

    if(loader&&!game)fail(400,"mc_filter_version");
    const params={gameId:CURSEFORGE_MINECRAFT,classId:TYPE_INFO[type].classId,index:offset,pageSize:PAGE_SIZE};
    if(q)params.searchFilter=q;
    if(game)params.gameVersion=game;
    if(loader)params.modLoaderType=LOADERS[loader];
    if(CURSEFORGE_SORT[sort])Object.assign(params,{sortField:CURSEFORGE_SORT[sort],sortOrder:"desc"});
    return cached("cf-search:"+JSON.stringify(params),async()=>{
      const data=await request(source,"/mods/search",params);
      const hits=list(data.data).map(project=>({
        id:String(project.id),source,type,title:text(project.name,140),desc:text(project.summary,360),
        author:list(project.authors).map(author=>text(author.name,50)).filter(Boolean).slice(0,3).join(", "),
        icon:httpsUrl(project.logo?.thumbnailUrl||project.logo?.url),downloads:count(project.downloadCount),
        games:gameVersions(list(project.latestFilesIndexes).map(file=>file.gameVersion)),
        loaders:knownLoaders(list(project.latestFilesIndexes).map(file=>
          Object.keys(LOADERS).find(loader=>LOADERS[loader]===file.modLoader))),
        license:"",url:curseForgeLink(project,type)
      }));
      return {source,hits,pagination:pageInfo(page,count(data.pagination?.totalCount),hits.length,source)};
    });
  }

  async function projectInfo(source,id,fallbackType) {
    return cached(source+"-project:"+id+":"+fallbackType,async()=>{
      if(source==="modrinth"){
        const data=await request(source,"/project/"+encodeURIComponent(id));
        const type=validType(data.project_type||fallbackType);
        return {
          id,source,type,title:text(data.title,140),icon:httpsUrl(data.icon_url),
          downloads:count(data.downloads),games:gameVersions(list(data.game_versions)),
          loaders:knownLoaders(list(data.loaders)),url:modrinthLink(type,data.slug||id)
        };
      }
      const {data}=await request(source,"/mods/"+id);
      if(!data)fail(404,"mc_project_missing");
      const type=Object.keys(TYPE_INFO).find(key=>TYPE_INFO[key].classId===data.classId)||fallbackType;
      const index=list(data.latestFilesIndexes);
      return {
        id,source,type,title:text(data.name,140),icon:httpsUrl(data.logo?.thumbnailUrl||data.logo?.url),
        downloads:count(data.downloadCount),url:curseForgeLink(data,type),allowDirect:data.allowModDistribution!==false,
        games:gameVersions([...index.map(file=>file.gameVersion),...list(data.latestFiles).flatMap(curseFileGames)]),
        loaders:knownLoaders([...list(data.latestFiles).flatMap(file=>list(file.gameVersions)),
          ...index.map(file=>Object.keys(LOADERS).find(key=>LOADERS[key]===file.modLoader))])
      };
    });
  }

  async function versions(sp) {
    const source=sourceName(sp);
    requireSource(source);
    const id=sp.get("id")||"";
    if(!(source==="curseforge"?/^[1-9]\d{0,9}$/:/^[\w-]{1,64}$/).test(id))fail(400,"invalid");
    const {type,game,loader,page}=filters(sp,source);
    const offset=page*PAGE_SIZE;
    if(source==="modrinth"){
      const params={include_changelog:"false"};
      if(game)params.game_versions=JSON.stringify([game]);
      if(loader)params.loaders=JSON.stringify([loader]);
      const [project,all]=await Promise.all([
        projectInfo(source,id,type),
        cached("mr-versions:"+id+":"+JSON.stringify(params),async()=>{
          const values=await request(source,"/project/"+encodeURIComponent(id)+"/version",params);
          if(!Array.isArray(values))fail(502,"upstream");
          return values;
        })
      ]);
      const rows=all.slice(offset,offset+PAGE_SIZE).map(version=>normalizeModrinthVersion(version,project));
      return {project,versions:rows,pagination:pageInfo(page,all.length,rows.length,source)};
    }

    const params={index:offset,pageSize:PAGE_SIZE};
    if(game)params.gameVersion=game;
    if(loader)params.modLoaderType=LOADERS[loader];
    const [project,data]=await Promise.all([
      projectInfo(source,id,type),
      cached("cf-files:"+id+":"+JSON.stringify(params),()=>request(source,"/mods/"+id+"/files",params))
    ]);
    const rows=list(data.data).map(file=>normalizeCurseVersion(file,project,loader));
    return {project,versions:rows,pagination:pageInfo(page,count(data.pagination?.totalCount),rows.length,source)};
  }

  async function metadata(sp) {
    const source=sourceName(sp);
    requireSource(source);
    return cached(source+"-game-versions",async()=>{
      const data=source==="modrinth"
        ? await request(source,"/tag/game_version")
        : await request(source,"/games/"+CURSEFORGE_MINECRAFT+"/versions");
      const names=source==="modrinth"
        ? list(data).map(version=>version.version)
        : list(data.data).flatMap(group=>list(group.versions));
      return {source,games:gameVersions(names)};
    },12*60*60*1000);
  }

  return {sources,search,versions,metadata};
}

module.exports = {createMinecraftCatalog};

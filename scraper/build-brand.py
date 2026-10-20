# Builds output/brand.json from scraped data + raw-extras (computed styles).
import json
O='/home/user/Websites/scraper/output'
x=json.load(open(f'{O}/raw-extras.json'))
brand={
 "businessName":"Astrum (Astrum Realty / astrumuae.com)",
 "tagline":"Jouw partner in de Emiraten",
 "heroHeadline":"Voor wie verder kijkt.",
 "whatTheyDo":"Boutique makelaarskantoor (real estate agency) in Dubai dat Nederlanders helpt bij het kopen, verkopen en investeren in vastgoed in Dubai/VAE. Positionering: eerlijk advies zonder haast, echte transactieprijzen i.p.v. beloftes, één vast Nederlandstalig aanspreekpunt.",
 "metaDescription":"Astrum is een boutique makelaarskantoor in Dubai. Eerlijk advies, zonder haast.",
 "targetAudience":"Nederlandstalige (vastgoed)investeerders en kopers/verkopers in Dubai",
 "brandStatements":[
  "Het gaat niet om het hoogste gebouw of het snelste project. Het gaat om de keuze die past bij jouw plan.",
  "Eerlijk advies, zonder haast. Ook als het beste antwoord ‘nog niet’ is.",
  "Verder kijken dan één aankoop. Astrum begeleidt investeerders persoonlijk en met geduld. Samen bouwen we aan een portfolio voor nu en voor later, als je vaste partner in de Emiraten.",
  "Het begint met een eerlijk gesprek. Een goede aankoop start bij jouw plan. Pas daarna kijken we naar projecten.",
  "Goed vastgoed koop je met rust.",
  "Eerst praten. Dan pas kiezen."],
 "usps":["Eerst jouw plan, dan pas een woning","Echte verkoopprijzen in plaats van beloftes","Eén vast aanspreekpunt, in het Nederlands"],
 "services":[
  {"name":"Kopen","description":"We zoeken mee, toetsen de cijfers aan echte transacties en begeleiden je tot de overdracht.","price":None},
  {"name":"Verkopen","description":"Een eerlijke vraagprijs op basis van wat er echt betaald is. En een koper die past.","price":None},
  {"name":"Advies","description":"Twijfel je nog? Dan kijken we eerst samen of Dubai bij jouw plan past. Ook als het antwoord nee is.","price":None},
  {"name":"Portfolio opbouwen","description":"Alleen genoemd als onderwerp-optie in het contactformulier en in 'Waar wij voor staan' (portfolio voor nu en later).","price":None}],
 "servicesIntro":"Persoonlijke begeleiding en korte lijnen. Je hebt één aanspreekpunt, van het eerste gesprek tot na de overdracht.",
 "pricesNote":"Geen prijzen, tarieven of woningaanbod (listings) op de site.",
 "process":{"title":"Vier stappen. In jouw tempo.","steps":[
  {"n":"01","name":"Kennismaken","text":"We beginnen met jouw plan, niet met een project. Wat wil je, hoe lang kun je wachten, wat mag het kosten?","image":"assets/beeld/woonkamer-skyline.jpg"},
  {"n":"02","name":"Uitzoeken","text":"We vergelijken wijken, ontwikkelaars en echte verkoopprijzen. Je ziet wat er speelt, ook wat minder mooi is.","image":"assets/beeld/infinity-palm.jpg"},
  {"n":"03","name":"Aankopen","text":"We lopen elk document met je door en zijn erbij tot de overdracht. Geen haast om te tekenen.","image":"assets/beeld/terras-marina.jpg"},
  {"n":"04","name":"Daarna","text":"Ook na de sleutel blijven we bereikbaar. Voor vragen over verhuur, de markt of je volgende stap.","image":"assets/beeld/slaapkamer-palm.jpg"}]},
 "newsletter":{"name":"Astrum Private List","title":"Exclusieve marktupdates en kansen","text":"Wat er echt verkocht is, welke projecten eraan komen, en kansen die we eerst met deze lijst delen. Persoonlijk samengesteld, zonder ruis.","fields":["voornaam","email"],"note":"Je kunt je met één klik weer afmelden.","netlifyForm":"marktupdates"},
 "contact":{"email":"info@astrumuae.com","phone":None,"whatsapp":None,"address":None,"city":"Dubai, VAE (geen adres vermeld)","website":"https://astrumuae.com",
  "socials":{"instagram":"https://www.instagram.com/astrumuae","linkedin":"https://www.linkedin.com/company/astrumrealty/","tiktok":"genoemd in tekst ('Pim deelt op Instagram en TikTok') maar geen link/handle op de site"},
  "contactForm":{"netlifyForm":"kennismaking","trigger":"Modal 'Plan een gesprek' (header-knop, hero-knop, slot-CTA)","fields":[
   {"name":"naam","type":"text","required":True,"label":"Naam","placeholder":"Je volledige naam"},
   {"name":"email","type":"email","required":True,"label":"E-mail","placeholder":"naam@voorbeeld.nl"},
   {"name":"telefoon","type":"tel","required":False,"label":"Telefoon (optioneel)","placeholder":"+31 6 …"},
   {"name":"onderwerp","type":"radio","label":"Waar gaat het over?","options":["Kopen","Verkopen","Portfolio opbouwen","Eerst advies"]},
   {"name":"bericht","type":"textarea","required":False,"label":"Bericht","placeholder":"Vertel kort over je plannen"}],
   "submit":"Verstuur aanvraag","privacyNote":"We gebruiken je gegevens alleen om contact met je op te nemen over deze aanvraag.",
   "modalCopy":"Plan een gesprek. Vertel ons kort waar je staat. We nemen contact met je op voor een vrijblijvend gesprek, op een moment dat jou past."}},
 "openingHours":None,
 "team":[
  {"name":"Pim Verberg","role":"Co-founder","photo":"assets/team/pim-verberg.jpg","notes":"Gezicht van het merk; deelt marktinzichten op Instagram en TikTok."},
  {"name":"Denise Birjmohun","role":"Co-founder","photo":"assets/team/denise-birjmohun.jpg"},
  {"name":"Ron Veen","role":"Co-founder","photo":"assets/team/ron-veen.jpg"}],
 "teamGroupPhoto":{"file":"assets/team/over-astrum.jpg","alt":"Pim Verberg en Denise Birjmohun van Astrum in een sales gallery in Dubai"},
 "teamIntro":"De mensen achter Astrum. Persoonlijk betrokken, van het eerste gesprek tot ver na de overdracht.",
 "testimonials":[],
 "faq":[],
 "blog":{"title":"Inzichten uit de markt","intro":"Wat we zien in Dubai, zonder verkooppraat. Ook de dingen die je liever vooraf weet.","posts":[
  {"category":"Markt","title":"Vraagprijs of transactieprijs: wat er in Dubai echt betaald wordt","status":"Binnenkort (geen artikel/link)"},
  {"category":"Gebieden","title":"Waarom je in het zuiden van Dubai een tijdlijn koopt, geen wijk","status":"Binnenkort (geen artikel/link)"},
  {"category":"Off-plan","title":"Wat je checkt voordat je een off-plan contract tekent","status":"Binnenkort (geen artikel/link)"}]},
 "logo":{"type":"Tekst-wordmark 'ASTRUM' in Bodoni Moda, uppercase, zeer ruime letterspatiëring (hero ~0.32em). Geen logo-bestand.","favicon":"https://astrumuae.com/favicon.svg","faviconLocal":"assets/favicon.svg","faviconDescription":"Wit serif 'A' op #111 vierkant"},
 "colors":{
  "cssVariables":x['styles']['cssVariables'],
  "palette":[
   {"name":"ink","hex":"#1c1915","use":"tekst, donkere knoppen"},
   {"name":"cream","hex":"#f5f0e8","use":"hoofd-achtergrond, lichte knoppen"},
   {"name":"sand","hex":"#ebe3d6","use":"alternerende sectie-achtergrond"},
   {"name":"stone","hex":"#7d7468","use":"secundaire tekst"},
   {"name":"gold","hex":"#a8895a","use":"accent: cursieve kopwoorden, nummering, labels"},
   {"name":"light gold","hex":"#e6d3ad","use":"accent op donkere achtergronden (modal, private list)"},
   {"name":"near-black","hex":"#0f0d0b","use":"footer / modal"},
   {"name":"theme-color","hex":"#0e0d0c","use":"meta theme-color"}],
  "computedUsageTop":x['styles']['colorUsage']},
 "fonts":{"serif":{"family":"Bodoni Moda","weights":["400","400 italic","500"],"use":"koppen, wordmark, cursieve accentwoorden","source":"self-hosted (@fontsource)"},
  "sans":{"family":"Inter Variable","weights":"100-900","use":"lopende tekst, nav, knoppen (uppercase, 10.5px, letter-spacing ~0.26-0.3em)","source":"self-hosted (@fontsource-variable)"},
  "computedElements":x['styles']['elements']},
 "uiStyle":"Donker/crème luxe-editorial: grote Bodoni-koppen met één cursief goudkleurig woord, uppercase micro-labels met brede spatiëring, pill-knoppen (radius 999px), dunne lijnen, full-bleed foto's met donkere overlay, scroll-gestuurde hero frame-sequence (150 frames, canvas + GSAP ScrollTrigger), horizontale werkwijze-carrousel.",
 "languages":["nl"],
 "tech":{"stack":"Vite + React SPA, GSAP + ScrollTrigger, Netlify hosting + Netlify Forms (free tier, 'Powered by Netlify' badge/HUD zichtbaar)","pages":["/","/beeldbronnen.html"],"sitemap":None,"robotsTxt":None},
 "imageRights":"Volgens /beeldbronnen.html (concept): film en foto's komen van OMNIYAT (Orla en The Alba, Dorchester Collection) en worden alleen gebruikt met toestemming van OMNIYAT, anders vervangen. Teamfoto's zijn eigen beeld."
}
json.dump(brand,open(f'{O}/brand.json','w'),ensure_ascii=False,indent=2)
print('ok')

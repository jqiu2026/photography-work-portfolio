/**
 * Email address checks that need no network: the shape, and a list of throwaway-mailbox domains (the ones that hand
 * out an inbox for ten minutes so a person never has to give a real address). A real person asking for a shoot or a
 * newsletter has a real address, so these are refused with a polite message. Pure, so the browser form and the server
 * use the same rules. The list is not exhaustive (new services appear weekly); add to it when one slips through.
 */
const DISPOSABLE = new Set(
  `
10minutemail.com 10minutemail.net 10minutemail.org 10minutemail.co.uk 10minemail.com 10mail.org 20minutemail.com
20mail.it 33mail.com 4warding.com 5mail.cf 7tags.com 9ox.net a-bc.net adguard.cf afrobacon.com agedmail.com
ahk.jp airmail.cc anonbox.net anonymbox.com antispam.de armyspy.com artman-conception.com asdasd.ru
bccto.me bearsarefuzzy.com binkmail.com bio-muesli.net bobmail.info bofthew.com bootybay.de boun.cr bouncr.com
boxformail.in  brefmail.com brennendesreich.de broadbandninja.com bsnow.net bugmenot.com
bumpymail.com burnermail.io byom.de c2.hu casualdx.com cellurl.com  chammy.info
cheatmail.de chogmail.com choicemail1.com clixser.com cmail.club    cool.fr.nf
correo.blogos.net cosmorph.com courriel.fr.nf courrieltemporaire.com crapmail.org cuvox.de dacoolest.com
dandikmail.com dayrep.com dcemail.com deadaddress.com deadspam.com delikkt.de despam.it despammed.com
devnullmail.com dfgh.net digitalsanctuary.com dingbone.com discard.email discardmail.com discardmail.de
disposable.cf disposable.ga disposable.ml disposableaddress.com disposable-email.ml disposableemailaddresses.com
disposableinbox.com dispose.it disposeamail.com disposemail.com dispostable.com divermail.com dodgeit.com
dodgemail.de dodgit.com dodgit.org doiea.com domozmail.com donemail.ru dontreg.com dontsendmespam.de
dotmsg.com drdrb.com drdrb.net dropmail.me duam.net dudmail.com dumpandjunk.com dumpmail.de dumpyemail.com
e4ward.com easytrashmail.com einmalmail.de einrot.com einrot.de eintagsmail.de email-fake.com emailage.cf
emailage.ga emailage.gq emailage.ml emailage.tk emaildienst.de emailfake.com emailgo.de emailias.com
emailigo.de emailinfive.com emailisvalid.com emaillime.com emailmiser.com emailondeck.com emailproxsy.com
emailsensei.com emailtemporanea.com emailtemporanea.net emailtemporar.ro emailtemporario.com.br emailthe.net
emailtmp.com emailto.de emailwarden.com emailx.at.hm emailxfer.com emeil.in emeil.ir emz.net enterto.com
ephemail.net etranquil.com etranquil.net etranquil.org evopo.com explodemail.com express.net.ua
eyepaste.com fakeinbox.com fakeinformation.com fakemail.fr fakemailgenerator.com fakemailz.com fammix.com
fansworldwide.de fantasymail.de fastacura.com fastchevy.com fastchrysler.com fastkawasaki.com fastmazda.com
fastmitsubishi.com fastnissan.com fastsubaru.com fastsuzuki.com fasttoyota.com fastyamaha.com fatflap.com
fightallspam.com filzmail.com fivemail.de fixmail.tk fizmail.com fleckens.hu flurred.com flyspam.com
footard.com forgetmail.com fr33mail.info frapmail.com freundin.ru friendlymail.co.uk 
fuckingduh.com fudgerub.com fyii.de garliclife.com gehensiemirnichtaufdensack.de geschent.biz get-mail.cf
get1mail.com get2mail.fr getairmail.com getmails.eu getnada.com getonemail.com getonemail.net ghosttexter.de
giantmail.de girlsundertheinfluence.com gishpuppy.com  goemailgo.com gotmail.net gotmail.org
gotti.otherinbox.com great-host.in greensloth.com grr.la gsrv.co.uk guerillamail.biz guerillamail.com
guerillamail.de guerillamail.info guerillamail.net guerillamail.org guerillamailblock.com gustr.com
h.mintemail.com h8s.org hacccc.com haltospam.com harakirimail.com hartbot.de hat-geld.de hatespam.org
herp.in hidemail.de hidzz.com hmamail.com hochsitze.com hopemail.biz hot-mail.cf hot-mail.ga hot-mail.gq
hot-mail.ml hot-mail.tk  hulapla.de ieatspam.eu ieatspam.info ieh-mail.de ihateyoualot.info
iheartspam.org imails.info imgof.com imstations.com inbax.tk  inboxalias.com inboxclean.com
inboxclean.org inboxproxy.com incognitomail.com incognitomail.net incognitomail.org infocom.zp.ua
insorg-mail.info instant-mail.de instantemailaddress.com ipoo.org irish2me.com iwi.net jetable.com
jetable.fr.nf jetable.net jetable.org jnxjn.com jourrapide.com jsrsolutions.com junk1e.com kasmail.com
kaspop.com  killmail.com killmail.net kimsdisk.com kingsq.ga kiois.com klassmaster.com
klzlk.com koszmail.pl kulturbetrieb.info kurzepost.de l33r.eu lackmail.net lags.us landmail.co
lastmail.co lawlita.com letthemeatspam.com lhsdv.com lifebyfood.com link2mail.net litedrop.com
lol.ovpn.to lolfreak.net lookugly.com lortemail.dk lovemeleaveme.com lr78.com lroid.com lukop.dk
m21.cc mail-filter.com mail-temporaire.fr  mail.mezimages.net mail.zp.ua mail1a.de mail21.cc
mail2rss.org mail333.com mail4trash.com mailbidon.com mailbiz.biz mailblocks.com mailbucket.org
mailcat.biz mailcatch.com mailde.de mailde.info maildrop.cc maildrop.cf maildrop.ga maildrop.gq
maildrop.ml maildu.de maildx.com maileater.com mailed.ro maileimer.de mailexpire.com mailfa.tk
mailforspam.com mailfree.ga mailfree.gq mailfree.ml mailfreeonline.com mailguard.me mailhazard.com
mailhazard.us mailhz.me mailimate.com mailin8r.com mailinater.com mailinator.com mailinator.net
mailinator.org mailinator2.com mailincubator.com mailismagic.com mailjunk.cf mailjunk.ga mailjunk.gq
mailjunk.ml mailjunk.tk mailmate.com mailme.gq mailme.ir mailme.lv mailme24.com mailmetrash.com
mailmoat.com mailms.com mailnator.com mailnesia.com mailnull.com  mailpick.biz mailproxsy.com
mailquack.com mailrock.biz mailsac.com mailscrap.com mailseal.de mailshell.com mailsiphon.com
mailslapping.com mailslite.com mailtemp.info mailtemporaire.com mailtemporaire.fr mailtome.de mailtothis.com
mailtrash.net mailtv.net mailtv.tv mailzilla.com mailzilla.org makemetheking.com manifestgenerator.com
manybrain.com mbx.cc mciek.com mega.zik.dj meinspamschutz.de meltmail.com messagebeamer.de mezimages.net
mierdamail.com migmail.pl migumail.com ministry-of-silly-walks.de mintemail.com misterpinball.de
moakt.com moakt.ws mobi.web.id mobileninja.co.uk moburl.com moncourrier.fr.nf monemail.fr.nf
monmail.fr.nf monumentmail.com msa.minsmail.com mt2009.com mt2014.com mt2015.com mx0.wwwnew.eu
my10minutemail.com mycleaninbox.net myemailboxy.com mymail-in.net mymailoasis.com mynetstore.de
 mypartyclip.de myphantomemail.com mysamp.de myspaceinc.com myspaceinc.net myspaceinc.org
myspacepimpedup.com myspamless.com mytempemail.com mytempmail.com mytrashmail.com nabuma.com
neomailbox.com nepwk.com nervmich.net nervtmich.net netmails.com netmails.net netzidiot.de
neverbox.com nice-4u.com nincsmail.com nincsmail.hu nmail.cf nnh.com no-spam.ws noblepioneer.com
nobulk.com noclickemail.com nogmailspam.info nomail.pw nomail.xl.cx nomail2me.com nomorespamemails.com
nonspam.eu nonspammer.de noref.in nospam.ze.tc nospam4.us nospamfor.us nospammail.net nospamthanks.info
notmailinator.com notsharingmy.info nowhere.org nowmymail.com nurfuerspam.de  nwldx.com
objectmail.com obobbo.com odaymail.com odnorazovoe.ru oneoffemail.com oneoffmail.com onewaymail.com
onlatedotcom.info online.ms oopi.org opayq.com ordinaryamerican.net otherinbox.com ourklips.com
outlawspam.com ovpn.to owlpic.com pancakemail.com paplease.com pcusers.otherinbox.com pepbot.com
pfui.ru pimpedupmyspace.com pjjkp.com plexolan.de  politikerclub.de poofy.org
pookmail.com  privatdemail.net proxymail.eu prtnx.com putthisinyourspamdatabase.com
pwrby.com  quickinbox.com rcpt.at reallymymail.com realtyalerts.ca recode.me recursor.net
regbypass.com  rejectmail.com reliable-mail.com rhyta.com rklips.com
rmqkr.net  rppkn.com rtrtr.com s0ny.net safe-mail.net safersignup.de safetymail.info
safetypost.de sandelf.de saynotospams.com schafmail.de schrott-email.de secretemail.de secure-mail.biz
selfdestructingmail.com sendspamhere.com senseless-entertainment.com services391.com sharedmailbox.org
sharklasers.com shieldedmail.com shiftmail.com shitmail.me shitware.nl shmeriously.com shortmail.net
shut.name shut.ws sibmail.com  sinnlos-mail.de skeefmail.com slapsfromlastnight.com slaskpost.se
slipry.net slopsbox.com smashmail.de smellfear.com snakemail.com sneakemail.com sneakmail.de snkmail.com
sofimail.com sofort-mail.de sogetthis.com soodonims.com spam.la spam.su spam4.me spamail.de spamarrest.com
spamavert.com spambob.com spambob.net spambob.org spambog.com spambog.de spambog.ru spambox.info
spambox.irishspringrealty.com spambox.us spamcannon.com spamcannon.net spamcero.com spamcon.org
spamcorptastic.com spamcowboy.com spamcowboy.net spamcowboy.org spamday.com spamex.com spamfree.eu
spamfree24.com spamfree24.de spamfree24.eu spamfree24.info spamfree24.net spamfree24.org spamgoes.in
spamgourmet.com spamgourmet.net spamgourmet.org spamherelots.com spamhereplease.com spamhole.com
spamify.com spaminator.de spamkill.info spaml.com spaml.de spammotel.com spamobox.com spamoff.de spamslicer.com
spamspot.com spamstack.net spamthis.co.uk spamthisplease.com spamtrail.com spamtroll.net speed.1s.fr
spikio.com spoofmail.de squizzy.de ssoia.com startkeys.com stinkefinger.net stuffmail.de super-auswahl.de
supergreatmail.com supermailer.jp superrito.com superstachel.de suremail.info svk.jp sweetxxx.de
tafmail.com tagyourself.com talkinator.com tapchicuoihoi.com teewars.org teleworm.com teleworm.us
temp-mail.com temp-mail.de temp-mail.io temp-mail.org temp-mail.ru temp15qm.com tempail.com tempalias.com
tempe-mail.com tempemail.biz tempemail.co.za tempemail.com tempemail.net tempinbox.co.uk tempinbox.com
tempmail.co tempmail.de tempmail.eu tempmail.it tempmail.net tempmail.us tempmail2.com tempmaildemo.com
tempmailer.com tempmailer.de tempmailaddress.com tempomail.fr temporarily.de temporarioemail.com.br
temporaryemail.net temporaryemail.us temporaryforwarding.com temporaryinbox.com temporarymailaddress.com
tempsky.com tempthe.net tempymail.com thanksnospam.info thankyou2010.com thc.st thecloudindex.com
thelimestones.com thisisnotmyrealemail.com thismail.net throwam.com throwawayemailaddress.com
throwawaymail.com tilien.com tittbit.in tizi.com tmail.ws tmailinator.com tmpmail.net tmpmail.org
toiea.com toomail.biz topranklist.de tradermail.info trash-amil.com trash-mail.at trash-mail.cf
trash-mail.com trash-mail.de trash-mail.ga trash-mail.gq trash-mail.ml trash-mail.tk trash2009.com
trash2010.com trash2011.com trashdevil.com trashdevil.de trashemail.de trashemails.de trashmail.at
trashmail.com trashmail.de trashmail.me trashmail.net trashmail.org trashmail.ws trashmailer.com trashymail.com
trashymail.net trbvm.com trialmail.de trickmail.net trillianpro.com trollproject.com tryalert.com
turual.com twinmail.de twoweirdtricks.com tyldd.com ubismail.net uggsrock.com umail.net upliftnow.com
uplipht.com uroid.com us.af valemail.net venompen.com veryrealemail.com vidchart.com viditag.com
viewcastmedia.com viewcastmedia.net viewcastmedia.org vipmail.name vkcode.ru vomoto.com vpn.st vsimcard.com
vubby.com walala.org walkmail.net wasteland.rfc822.org webemail.me webm4il.info webuser.in wegwerf-email-addressen.de
wegwerfadresse.de wegwerfemail.com wegwerfemail.de wegwerfmail.de wegwerfmail.info wegwerfmail.net
wegwerfmail.org wh4f.org whatiaas.com whatpaas.com whatsaas.com whopy.com whyspam.me wickmail.net
wilemail.com willhackforfood.biz willselfdestruct.com winemaven.info wronghead.com wuzup.net wuzupmail.net
www.e4ward.com www.gishpuppy.com www.mailinator.com wwwnew.eu x.ip6.li xagloo.com xemaps.com xents.com
xmaily.com xoxy.net xww.ro yapped.net  yep.it yogamaven.com yopmail.com yopmail.fr yopmail.net
 ypmail.webarnak.fr.eu.org yuurok.com z1p.biz  zehnminuten.de zehnminutenmail.de
zetmail.com zippymail.info zoaxe.com zoemail.com zoemail.net zoemail.org zomg.info zxcv.com zxcvbnm.com
tmpeml.com tmpbox.net guerrillamail.com guerrillamail.net guerrillamail.org guerrillamail.biz guerrillamail.de
guerrillamail.info mohmal.com emailondeck.com inboxbear.com mailpoof.com 1secmail.com 1secmail.net 1secmail.org
kzccv.com qiott.com wuuvo.com icznn.com ezztt.com vjuum.com laafd.com txcct.com esiix.com xojxe.com yoggm.com
rteet.com tmmbt.com tmmwj.com tmpmail.net mail.tm cloudmail.tk linshiyouxiang.net luxusmail.org
fakemailgenerator.net emltmp.com dropmail.me 10mail.xyz moakt.cc tempr.email temp-inbox.com instaddr.ch
emailfake.com generator.email crazymailing.com tempmailo.com minuteinbox.com 
`
    .split(/\s+/)
    .filter(Boolean),
);

const SHAPE = /^[^\s@,;<>()[\]\\]+@([^\s@,;<>()[\]\\]+\.[^\s@,;<>()[\]\\]{2,})$/;

/** True when the domain, or a parent of it (`x.mailinator.com`), is a throwaway-mailbox service. */
export function isDisposableDomain(domain: string): boolean {
  const parts = domain.trim().toLowerCase().split(".");
  for (let i = 0; i < parts.length - 1; i++) if (DISPOSABLE.has(parts.slice(i).join("."))) return true;
  return false;
}

export type EmailCheck = { ok: true } | { ok: false; reason: "shape" | "disposable"; message: string };

/** Shape first, then the throwaway list. The messages are written for the person who typed the address. */
export function checkEmail(email: string): EmailCheck {
  const value = email.trim();
  const m = SHAPE.exec(value);
  if (!m || value.length > 200)
    return { ok: false, reason: "shape", message: "That doesn't look like an email address." };
  if (isDisposableDomain(m[1] as string))
    return {
      ok: false,
      reason: "disposable",
      message: "That looks like a temporary email address. Please use one you check, so I can reply to you.",
    };
  return { ok: true };
}

#!/usr/bin/env node
// A project past any agent's window, built through the kernel (pass 3a,
// docs/plan.md, goal 3): "Low Water", a series of six hour-long episodes,
// forty cards each, every scene written, one cast across the boards, folds
// that pay off on other boards — and three things put in on purpose for the
// blind agent's directions: a person's want the story drops after episode
// two (Kit Fenn's), a fold on episode one nothing ever pays off (the brass
// key), and second acts fatter than their first and third. Deterministic in
// everything but the ids the kernel mints: the same wall every run, so the
// size can be rebuilt and counted again.
//
//   node scripts/generate-series.mjs [out.json]      default: low-water.json
//
// The output is the file Save project writes; import_project takes it
// through any door. Nothing here touches the network or the account.

import fs from "node:fs";
import path from "node:path";
import { applyCommand, emptyState } from "../src/board/reducer.js";
import { addBoard, emptyProject, mergeRoster, renameBoard, renameProject, setActiveBoard, setPremise, setTitlePage, withRoster } from "../src/board/project.js";
import { toProjectFile } from "../src/board/projectFile.js";
import { sceneLineCount } from "../src/board/paginate.js";

const AT = "2026-09-27T09:00:00.000Z";
let tick = 0;
const now = () => new Date(Date.parse(AT) + (tick += 1000)).toISOString();

// --- The world ---------------------------------------------------------------

const CAST = [
  ["Nell Carrick", "harbourmaster, 44, salt in the hair, a coat too big for her", "short, dry, never raises it", "to keep the harbour working through the winter", "to stop carrying the town alone", "Runs the harbour office her father ran. Signs everything."],
  ["Tom Carrick", "her younger brother, 38, skipper of the Maureen", "warm, quick, always half joking", "to sell the boat and go", "to be forgiven", "Skipper of the family boat. Owes money he has not told Nell about."],
  ["Ada Quill", "the harbour's book-keeper, sixties, cardigan, reading glasses on a chain", "precise, quiet, will repeat a number until it is heard", "to find where the mooring money went", "to be believed", "Has kept the ledger for thirty years. Never lost a penny before this."],
  ["Sol Brandt", "developer from the city, fifties, good boots that have not seen mud", "easy, reasonable, never says no outright", "the harbour land for the marina", "nothing he would admit to", "Brandt Coastal. The marina plans have been on the council table twice before."],
  ["Ines Marr", "Brandt's surveyor, thirties, hi-vis and a level", "plain, technical, tired", "a clean survey and out by the equinox", "to say what the sea wall is", "Sent to survey the harbour for Brandt. Sleeps in a caravan on the ferry road."],
  ["Bram Holt", "harbour engineer, fifties, a limp from the '09 storm", "slow, careful, one word where three would do", "the sea wall repaired before the equinox tides", "someone to listen", "Has filed the same report on the wall three years running."],
  ["Kit Fenn", "seventeen, works at Rosa's café, bike with no lights", "fast, sharp, older than they are", "to get out of Salt Harbour before the winter boats go", "a reason to stay or a way to leave", "Has a berth half-promised on the winter boats. Nobody asks Kit anything."],
  ["Rosa Vane", "café owner, fifties, holds the fish-hut lease", "loud, generous, keeps a tally nobody sees", "to keep the fish-hut lease", "to stop lending money she has not got", "The café on the slip. Everyone owes her; she owes the bank."],
  ["Owen Petty", "councillor, sixties, a good coat and a bad tie", "smooth, long sentences, none of them answers", "the marina vote to pass", "to be seen to have done right", "Chairs the harbour committee. Brandt has his ear and his number."],
  ["June Aldous", "Nell and Tom's mother, seventies, kitchen never cold", "soft, slow, lands the last word", "the Maureen kept in the family", "to say what happened to the money", "Widow of the old harbourmaster. The Maureen is in her name."],
  ["Mira Sato", "the town's doctor, forties, the only car that starts", "kind, blunt, in a hurry", "June looked after", "less to do", "Doctor to the whole town. Knows what nobody says."],
  ["Con Reilly", "the harbour's oldest boatman, eighties, hands like rope", "few words, mostly weather", "to die on the water, not in a bed", "nothing; he has it", "Taught Tom to skipper. Remembers the wall going up."],
];

const PLACES = {
  office: "THE HARBOUR OFFICE", boat: "THE MAUREEN, AT HER MOORING", slip: "THE SLIP", cafe: "ROSA'S CAFÉ",
  chamber: "THE COUNCIL CHAMBER", hut: "THE FISH HUT", wall: "THE SEA WALL", kitchen: "JUNE'S KITCHEN",
  caravan: "THE SURVEYOR'S CARAVAN, FERRY ROAD", hall: "THE CHURCH HALL", breakwater: "THE BREAKWATER", road: "THE FERRY ROAD",
};
const INTERIOR = new Set(["office", "cafe", "chamber", "hut", "kitchen", "caravan", "hall"]);
const WHENS = ["DAY", "NIGHT", "MORNING", "EVENING", "DAWN", "DUSK"];

// Each episode: name, logline, subjects the filler scenes turn on, and the
// spine — the scenes that carry the story, at fixed slots of the forty.
// A spine scene: [slot, headline, change, place, when, cast, beat?, extra]
//   extra.plant   — folds the card with these words
//   extra.payoff  — { key } this card pays off the fold registered under key
//   extra.key     — registers this fold for a later payoff
//   extra.promise — the fold pays off on a later episode, no scene named
const EPISODES = [
  {
    name: "Low Water", logline: "A harbourmaster finds the sea wall cracked and the harbour's money gone in the same week.",
    subjects: ["the mooring money", "the crack in the wall", "the winter boats"],
    spine: [
      [1, "The wall, first light", "Bram finds the crack has gone through to the seaward face", "wall", "DAWN", ["Bram Holt", "Con Reilly"], true],
      [4, "Nell opens the office", "Nell finds a brass key in the ledger drawer that fits nothing she knows", "office", "MORNING", ["Nell Carrick"], false, { plant: "the brass key in the ledger drawer", key: "brass-key" }],
      [8, "Ada's column", "Ada tells Nell the mooring account is forty thousand short", "office", "DAY", ["Ada Quill", "Nell Carrick"], true, { plant: "the ledger's missing page — the one Ada cannot find", key: "ledger-page" }],
      [12, "Brandt on the slip", "Sol Brandt offers to pay for the wall, for the land behind it", "slip", "DAY", ["Sol Brandt", "Nell Carrick", "Owen Petty"], true],
      [16, "Kit asks for a berth", "Tom half-promises Kit a place on the winter boats", "boat", "EVENING", ["Kit Fenn", "Tom Carrick"], false],
      [20, "June's table", "June says the Maureen is not for sale while she lives", "kitchen", "NIGHT", ["June Aldous", "Tom Carrick", "Nell Carrick"], true],
      [25, "The committee", "Owen puts the marina back on the table", "chamber", "EVENING", ["Owen Petty", "Sol Brandt", "Nell Carrick", "Rosa Vane"], true],
      [30, "Tom's debt", "Tom tells Con he owes money on the boat and nobody knows", "breakwater", "DUSK", ["Tom Carrick", "Con Reilly"], true],
      [34, "Kit on the breakwater", "Kit tells Rosa they are leaving on the first winter boat", "breakwater", "NIGHT", ["Kit Fenn", "Rosa Vane"], false],
      [38, "The spring tide", "The tide comes over the wall for the first time in thirty years", "wall", "NIGHT", ["Nell Carrick", "Bram Holt", "Con Reilly", "Kit Fenn"], true],
      [40, "Nell signs", "Nell signs Brandt's survey order to get the wall looked at", "office", "DAWN", ["Nell Carrick", "Ada Quill"], true],
    ],
  },
  {
    name: "The Survey", logline: "A surveyor measures the harbour for a marina while the harbourmaster's brother measures how far he can run.",
    subjects: ["the survey", "the sale papers", "the caravan on the ferry road"],
    spine: [
      [1, "Ines arrives", "Ines Marr parks her caravan on the ferry road and starts measuring", "road", "MORNING", ["Ines Marr", "Con Reilly"], true],
      [5, "The sale papers", "Tom signs Nell's name on the papers to sell the Maureen", "boat", "NIGHT", ["Tom Carrick"], true, { plant: "Nell's signature on the sale papers, in Tom's hand", key: "forged" }],
      [9, "Kit and the boats", "Kit is told the winter boats sail a week early", "slip", "DAY", ["Kit Fenn", "Tom Carrick", "Con Reilly"], false],
      [13, "Ada at the bank", "Ada learns the mooring money went out in one transfer, signed", "office", "DAY", ["Ada Quill", "Nell Carrick"], true],
      [17, "Ines on the wall", "Ines finds the wall's footing is sand, not rock", "wall", "DAY", ["Ines Marr", "Bram Holt"], true, { plant: "the survey's finding — sand under the wall", key: "sand", promise: 5 }],
      [21, "Kit tells Rosa", "Kit gives Rosa notice; Rosa lends them the fare", "cafe", "MORNING", ["Kit Fenn", "Rosa Vane"], false],
      [25, "June's admission", "June tells Mira the money was hers to give, and she gave it", "kitchen", "EVENING", ["June Aldous", "Mira Sato"], true, { plant: "what June gave the money for", key: "june-gave" }],
      [29, "Brandt's dinner", "Sol tells Owen the survey will say what Owen needs it to", "hall", "NIGHT", ["Sol Brandt", "Owen Petty"], true],
      [33, "Nell reads the survey", "Nell finds the survey says the harbour cannot be saved as it is", "office", "NIGHT", ["Nell Carrick", "Ines Marr"], true],
      [37, "The first winter boat", "The first winter boat sails without Kit", "slip", "DAWN", ["Kit Fenn", "Tom Carrick", "Rosa Vane"], true],
      [40, "Tom's cabin", "Tom hides the signed papers in the Maureen's chart drawer", "boat", "NIGHT", ["Tom Carrick"], false],
    ],
  },
  {
    name: "Spring Tides", logline: "The missing page turns up in the fish hut, and the man who could save the wall is told to stop writing reports.",
    subjects: ["the ledger page", "Bram's report", "the fish hut's padlock"],
    spine: [
      [1, "The hut's new padlock", "Rosa finds the fish hut padlocked with a lock she did not buy", "hut", "MORNING", ["Rosa Vane", "Kit Fenn"], true],
      [5, "Bram's report", "Bram files the report that says the wall goes at the equinox", "office", "DAY", ["Bram Holt", "Nell Carrick"], true, { plant: "Bram's report, filed and dated", key: "report" }],
      [9, "The page in the hut", "Ada finds the ledger's missing page nailed under the fish-hut bench", "hut", "DAY", ["Ada Quill", "Rosa Vane"], true, { payoff: "ledger-page" }],
      [13, "The survey map", "Ines marks the caravan's copy of the survey map where the sand begins", "caravan", "NIGHT", ["Ines Marr"], false, { plant: "the marked survey map", key: "map", promise: 4 }],
      [17, "Owen buries it", "Owen tells Bram the report will not go to committee", "chamber", "DAY", ["Owen Petty", "Bram Holt"], true],
      [21, "The page's signature", "The page shows the transfer signed by June", "office", "EVENING", ["Ada Quill", "Nell Carrick"], true],
      [25, "Nell and June", "June will not say what the money bought", "kitchen", "NIGHT", ["Nell Carrick", "June Aldous"], true],
      [29, "Con's boat", "Con asks Tom to take him out one more time before the tides", "slip", "DUSK", ["Con Reilly", "Tom Carrick"], false],
      [33, "Sol's offer, doubled", "Sol offers Rosa twice the lease's worth to give up the hut", "cafe", "DAY", ["Sol Brandt", "Rosa Vane"], true],
      [37, "Mira's warning", "Mira tells Nell that June has weeks, not months", "road", "DUSK", ["Mira Sato", "Nell Carrick"], true],
      [40, "The tide table", "Nell circles the equinox on the tide table", "office", "NIGHT", ["Nell Carrick"], true],
    ],
  },
  {
    name: "The Vote", logline: "The council votes on the marina with a forged signature on the table and a lease pulled from under the café.",
    subjects: ["the vote", "the lease", "the sale papers"],
    spine: [
      [1, "The notice", "The council posts the marina vote for Friday", "chamber", "MORNING", ["Owen Petty", "Nell Carrick"], true],
      [5, "The chart drawer", "Nell finds the sale papers in the Maureen's chart drawer, in her own name", "boat", "DAY", ["Nell Carrick"], true, { payoff: "forged" }],
      [9, "Nell and Tom", "Tom admits the signature and the debt", "breakwater", "DUSK", ["Nell Carrick", "Tom Carrick"], true],
      [13, "Rosa's lease", "The council pulls the fish-hut lease for non-payment", "cafe", "MORNING", ["Rosa Vane", "Owen Petty"], true],
      [17, "Ines resigns", "Ines tells Sol she will not sign the survey as it stands", "caravan", "NIGHT", ["Ines Marr", "Sol Brandt"], true],
      [21, "Bram at the hall", "Bram reads his report aloud to a hall of eleven people", "hall", "EVENING", ["Bram Holt", "Con Reilly", "Ada Quill"], false],
      [25, "The vote", "The marina passes by one vote, Owen's", "chamber", "EVENING", ["Owen Petty", "Sol Brandt", "Nell Carrick", "Rosa Vane", "Bram Holt"], true],
      [29, "After the vote", "Nell tears up Brandt's survey order in front of him", "slip", "NIGHT", ["Nell Carrick", "Sol Brandt"], true],
      [33, "June's chair", "June asks Nell to bring the Maureen's papers to the kitchen", "kitchen", "NIGHT", ["June Aldous", "Nell Carrick", "Mira Sato"], false],
      [37, "The padlock again", "Rosa cuts the padlock off the fish hut", "hut", "DAWN", ["Rosa Vane", "Kit Fenn"], true],
      [40, "Sol's car", "Sol drives out the ferry road with the vote in his pocket", "road", "DAWN", ["Sol Brandt", "Ines Marr"], false],
    ],
  },
  {
    name: "The Maureen", logline: "A brother takes the family boat out into a storm to prove it is worth more than the money he owes on it.",
    subjects: ["the boat", "the storm", "what June gave"],
    spine: [
      [1, "The forecast", "Con reads the glass and says the storm is two days out", "slip", "MORNING", ["Con Reilly", "Tom Carrick"], true],
      [5, "The buyer", "Tom's buyer says the boat is worth half without the papers", "cafe", "DAY", ["Tom Carrick", "Rosa Vane"], true],
      [9, "June's kitchen, the papers", "June tells Nell and Tom the money paid off their father's debt on the Maureen", "kitchen", "EVENING", ["June Aldous", "Nell Carrick", "Tom Carrick"], true, { payoff: "june-gave" }],
      [13, "Ada's last column", "Ada balances the ledger and closes it", "office", "NIGHT", ["Ada Quill"], false],
      [17, "The map's copy", "Bram is given Ines's marked survey map", "caravan", "NIGHT", ["Bram Holt", "Ines Marr"], true, { payoff: "map" }],
      [21, "Tom casts off", "Tom takes the Maureen out ahead of the storm with Con aboard", "boat", "DAWN", ["Tom Carrick", "Con Reilly"], true],
      [25, "The harbour office, the radio", "Nell loses the Maureen on the radio", "office", "DAY", ["Nell Carrick", "Ada Quill", "Bram Holt"], true],
      [29, "The breakwater in the storm", "Nell and Rosa watch the Maureen come round the head under one sail", "breakwater", "NIGHT", ["Nell Carrick", "Rosa Vane", "Kit Fenn"], true],
      [33, "Con on the slip", "Con walks off the boat on his own feet and sits down on the slip", "slip", "NIGHT", ["Con Reilly", "Tom Carrick", "Mira Sato"], true],
      [37, "The bed", "June dies in her chair with the tide going out", "kitchen", "DAWN", ["June Aldous", "Mira Sato", "Nell Carrick"], true],
      [40, "The boat's name", "Tom paints the boat's name fresh", "boat", "DAY", ["Tom Carrick"], false],
    ],
  },
  {
    name: "Equinox", logline: "The equinox tide takes the sea wall, and the report that said it would is read into the record.",
    subjects: ["the equinox tide", "the report", "the marina"],
    spine: [
      [1, "The morning of the tide", "Bram tells Nell the wall goes tonight", "wall", "MORNING", ["Bram Holt", "Nell Carrick"], true],
      [5, "The funeral", "The town buries June; Owen does not come", "hall", "DAY", ["Nell Carrick", "Tom Carrick", "Rosa Vane", "Mira Sato", "Con Reilly", "Ada Quill"], true],
      [9, "Ines's file", "Ines gives Nell the report Owen buried, and the survey she would not sign", "office", "DAY", ["Ines Marr", "Nell Carrick"], true, { payoff: "report" }],
      [13, "Sol returns", "Sol comes back for the signing and finds the office shut", "slip", "DAY", ["Sol Brandt", "Ada Quill"], false],
      [17, "The hall, again", "Nell reads Bram's report into the council record", "chamber", "EVENING", ["Nell Carrick", "Bram Holt", "Owen Petty", "Sol Brandt"], true],
      [21, "The wall goes", "The sea wall goes at the top of the tide", "wall", "NIGHT", ["Bram Holt", "Nell Carrick", "Tom Carrick", "Con Reilly", "Kit Fenn"], true],
      [25, "The slip under water", "Rosa's café floods to the counter", "cafe", "NIGHT", ["Rosa Vane", "Kit Fenn", "Mira Sato"], true],
      [29, "Owen's resignation", "Owen resigns before the recount", "chamber", "MORNING", ["Owen Petty", "Nell Carrick"], true],
      [33, "The recount", "The marina vote is overturned", "chamber", "DAY", ["Nell Carrick", "Sol Brandt", "Rosa Vane", "Bram Holt", "Ada Quill"], true],
      [37, "The Maureen at the wall", "Tom moors the Maureen where the wall was", "boat", "DUSK", ["Tom Carrick", "Nell Carrick"], true],
      [40, "Low water", "Nell opens the office on the first morning without a wall", "office", "DAWN", ["Nell Carrick", "Ada Quill"], true],
    ],
  },
];

// Filler scenes: the texture between the spine, turned on the episode's
// subjects. [headline, change, place, when, cast slots]; {A}/{B} are people,
// {S} the subject. Kit is in the pool for episodes one and two only, and
// after that only behind the café counter, with nothing to say about leaving.
const FILLERS = [
  ["{A} asks {B} about {S}", "{B} lies to {A} about {S}", "cafe", "MORNING", 2],
  ["{A} counts {S} again", "{A} finds {S} short by more than yesterday", "office", "NIGHT", 1],
  ["{B} offers {A} a way out", "{A} says no to {B}, for now", "breakwater", "DUSK", 2],
  ["{B} says Friday", "{B} tells {A} the boats go Friday", "slip", "DAWN", 2],
  ["The morning rush", "Rosa lends money she has not got", "cafe", "MORNING", 0],
  ["A hand's width", "Bram finds the crack has grown a hand's width", "wall", "DAY", 0],
  ["{A} brings June the paper", "June says nothing about {S}, twice", "kitchen", "EVENING", 1],
  ["Owen takes a call", "Owen promises Sol the vote on {S}", "chamber", "DAY", 0],
  ["{A} decides to tell {B}", "{A} decides to tell {B} about {S}", "breakwater", "NIGHT", 2],
  ["Who sleeps in the hut", "{B} has been sleeping in the hut, and {A} finds the blanket", "hut", "NIGHT", 2],
  ["Mira's rounds", "Mira tells {A} to sleep, and {A} does not", "road", "DUSK", 1],
  ["Con reads the glass", "Con says the weather is turning on {S}", "slip", "MORNING", 0],
  ["Ines shows {A} a number", "Ines shows {A} a number she should not have", "caravan", "NIGHT", 1],
  ["Said out loud", "{A} says in public what {B} said in private about {S}", "hall", "EVENING", 2],
  ["Tom has moved {S}", "{A} finds Tom has moved {S}", "boat", "DAY", 1],
  ["{B} comes to the office and leaves", "{B} leaves without saying what they came for", "office", "DAY", 2],
  ["Sol's car outside {B}'s", "{A} sees Sol's car outside {B}'s door", "road", "DUSK", 2],
  ["{A} keeps a note back", "{A} keeps a note about {S} back from {B}", "cafe", "NIGHT", 2],
  ["The tin on the top shelf", "June moves the tin before {A} can ask about it", "kitchen", "NIGHT", 1],
  ["The bank rings again", "Rosa lets the bank ring out while {A} watches", "cafe", "DAY", 1],
  ["Ines walks the footing", "Ines finds the sand runs further than her map says", "wall", "DAWN", 0],
  ["{A} and {B} at the lamp", "{B} tells {A} what {S} will cost, to the pound", "breakwater", "NIGHT", 2],
  ["Bram's second copy", "Bram gives {A} a copy of the report to keep somewhere dry", "office", "EVENING", 1],
  ["Tom's buyer rings", "Tom takes a call about the boat and lies to {A} about who it was", "boat", "MORNING", 1],
  ["The committee adjourns", "Owen adjourns before {A} can speak on {S}", "chamber", "EVENING", 1],
  ["Mira and June", "Mira gives June the news and June gives it back", "kitchen", "DAY", 0],
  ["{A} sees the drawings", "Sol shows {A} the marina drawings and watches their face", "caravan", "DAY", 1],
  ["Two coffees, one black", "{A} orders and cannot pay; Rosa does not write it down", "cafe", "MORNING", 1],
  ["The winter boats' list", "{A} finds Kit's name is not on the list", "slip", "DUSK", 1],
  ["Con's chair on the slip", "Con tells {A} what the wall sounded like going up", "slip", "EVENING", 1],
];

// Lines for a person's mouth: {S} the subject, {O} the other person's first name.
const VOICES = {
  "Nell Carrick": ["We open at seven. We have always opened at seven.", "Say it plainly, {O}.", "The harbour is not a thing you can move.", "I signed it. I sign everything. That is the job.", "If {S} is what it is, then it is what it is.", "Don't tell me what I want to hear, {O}. I've had that all week.", "Who else knows?", "Then we do it in the morning, properly, with the ledger open."],
  "Tom Carrick": ["It's a boat, Nell. It's planks and a debt.", "I'll tell her. I will. Not tonight.", "{O}, you worry like the old man did.", "Friday, if the glass holds.", "Nobody asked me what I wanted from {S}.", "You think I haven't done the sums? I've done nothing but sums.", "One more season. That's all I'm asking.", "She'd sell it herself if she knew what it costs."],
  "Ada Quill": ["Forty thousand and six pence. I have said it three times.", "A number is not an opinion, {O}.", "It was there in March. It is not there now.", "I do not lose things.", "Somebody wrote {S} down. Somebody always writes it down.", "I've kept this book since before you could write your name.", "Show me the page, then. Show me the page.", "The bank has a copy. The bank always has a copy."],
  "Sol Brandt": ["I'm not the weather, {O}. I'm just the man with the umbrella.", "Nobody has to lose here.", "The wall is coming down whether we build or not.", "Think about it. Take the week.", "{S} is a detail. Details are what I pay for.", "You've seen the drawings. Eighty berths. A restaurant. Lights.", "I've built on worse ground than this.", "Everyone signs in the end, {O}. Everyone."],
  "Ines Marr": ["It's sand. Under the footing. All the way along.", "I measure. I don't decide.", "I'll be gone by the equinox, {O}. One way or the other.", "You don't want to see the numbers on {S}.", "I have been wrong before. Not about this.", "He pays me to survey. He doesn't pay me to lie. Not yet.", "Every line on that map is a place the sea gets in.", "Ask me again when the tide's out and I'll show you."],
  "Bram Holt": ["Three years I've filed it.", "Equinox. High water. Gone.", "{O}. Listen.", "It's not the crack. It's what's under it.", "Read the report. Just read it.", "I carried the second course of that wall in fifty-one with Con.", "You can shore it. You can't save it.", "Nobody reads. They vote."],
  "Kit Fenn": ["First boat out. I've got a berth.", "There's nothing here for me, {O}. You know that.", "I'm not asking. I'm telling you.", "Two coffees, one black.", "I'm not staying for {S}.", "Tom said Friday. Tom said.", "Everyone says next year. Nobody's ever gone.", "Table four wants the bill."],
  "Rosa Vane": ["Sit down, you're letting the cold in.", "Take it. You'll pay me when you pay me.", "That hut was my mother's and her mother's.", "{O}, I've heard every story this town has.", "I'll not be told about {S} by a man in a good coat.", "The bank rang again. I let it ring.", "Eat something. You look like the wall.", "I know what's owed. I've always known."],
  "Owen Petty": ["The committee's position, {O}, is evolving.", "Nobody wants to see the harbour fail.", "I hear you. I do hear you.", "Friday. Seven. Bring your reasons.", "{S} is a matter for the full council.", "There are procedures, and the procedures protect us all.", "I have never taken a penny I wasn't owed.", "Let's not make this personal, {O}."],
  "June Aldous": ["Put the kettle on, {O}.", "Your father would have known.", "It's in my name. It stays in my name.", "I gave what was mine to give.", "Ask me about {S} when I'm dead. Not before.", "You two were always like this. Even small.", "Sit. You're making the room tired.", "There's a tin on the top shelf. Leave it there."],
  "Mira Sato": ["She's tired, {O}. That's not nothing.", "Weeks. I'm sorry.", "I have four more calls and no petrol.", "Sleep. That's the prescription.", "{S} will keep. She won't.", "I'm a doctor, not a councillor. Thank God.", "Tell her yourself, {O}. She'd rather hear it from you.", "Half this town is holding its breath. It's not good for them."],
  "Con Reilly": ["Glass is falling.", "Wall went up in fifty-one. I carried the stone.", "Take her out, {O}. Once more.", "Sea doesn't vote.", "{S}. Aye. Well.", "Your father tied that knot. Leave it.", "I've buried better boats than her. Not many.", "Wind's gone round. It'll go round again."],
};

// Action between the lines: business the room does while nobody answers.
const BUSINESS = [
  "A gull lands on the sill and thinks better of it.", "The clock. The rain.", "{A} looks at the door, then does not go.", "Nobody moves.",
  "The tide, somewhere below, doing what it does.", "{A} turns a cup round on its saucer.", "{B} reads the tide table as if it might have changed.",
  "Outside, a boat's engine coughs, catches, dies.", "{A} takes off a coat and puts it back on.", "The bulb flickers and holds.",
  "{B} says nothing for as long as it takes.", "A lorry on the ferry road, then quiet.", "{A} writes something down and crosses it out.",
];

// A scene with one person in it is action, not a speech: what they do about the subject.
const ALONE = [
  "{A} opens the ledger to the page and reads it again, as if the numbers might have moved in the night.",
  "{A} walks the length of the room and back. Stops at the window. The harbour, grey, doing nothing.",
  "{A} picks up the telephone, dials four numbers, puts it down.",
  "A drawer, opened and shut. Then opened again. {A} takes out what is in it and lays it on the desk.",
  "{A} sits. The chair complains. {S}, on the desk, waits.",
  "{A} counts on the fingers of one hand, then starts again on the other.",
  "The light goes from the window while {A} is still not deciding.",
  "{A} writes a name on the back of an envelope and folds it twice.",
  "{A} puts the kettle on and forgets it. It boils itself dry.",
  "{A} looks at the photograph over the door for a long time.",
];

const OPENINGS = {
  office: "The harbour office: a desk, the tide table on the wall, the ledger open. Rain on the window.",
  boat: "The Maureen at her mooring, fenders squealing against the quay. Diesel and old rope.",
  slip: "The slip, weed-green below the tide line. Gulls on the fish boxes.",
  cafe: "Rosa's café on the slip, steamed windows, the radio low. Every table taken.",
  chamber: "The council chamber: a long table, eleven chairs, the harbour plans pinned crooked to a board.",
  hut: "The fish hut, tar and salt, a bench along the back wall. One bulb.",
  wall: "The sea wall, fifty yards of stone, the crack running through it like a river on a map.",
  kitchen: "June's kitchen. The range lit, the clock loud, the Maureen's photograph over the door.",
  caravan: "The surveyor's caravan on the ferry road. Maps on every surface, a kettle on the gas.",
  hall: "The church hall, folding chairs, the urn hissing at the back.",
  breakwater: "The breakwater, the lamp at the end of it, the sea working at the stones.",
  road: "The ferry road, single track, the sea on one side and the marsh on the other.",
};

// --- Helpers -------------------------------------------------------------------

function seeded(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const first = (name) => name.split(" ")[0];
const fill = (line, vars) => line.replace(/\{(\w)\}/g, (_, k) => vars[k] ?? _);

/** Draw from a bank without repeating until it is used up. */
function drawer(bank, random) {
  let left = [];
  return () => {
    if (!left.length) left = [...bank];
    return left.splice(Math.floor(random() * left.length), 1)[0];
  };
}

/** The scene's text in Fountain, no heading (the card's place and when make it), long enough to run about `pages` pages. */
function sceneText(spec, subject, pages, random) {
  const cast = spec.cast.length ? spec.cast : ["Nell Carrick"];
  const target = Math.round(pages * 55);
  const vars = { A: first(cast[0]), B: first(cast[1] ?? cast[0]), S: subject };
  const lines = [OPENINGS[spec.place], "", `${cast.map(first).join(" and ")} ${cast.length === 1 ? "is" : "are"} here. ${spec.headline}.`];
  const business = drawer(BUSINESS, random);
  if (cast.length === 1) {
    const alone = drawer(ALONE, random);
    let text = lines.join("\n");
    let turns = 0;
    while (sceneLineCount(text) < target && turns < 40) {
      lines.push("", fill(alone(), vars));
      if (turns % 3 === 2) lines.push("", fill(business(), vars));
      turns += 1;
      text = lines.join("\n");
    }
  } else {
    const voices = new Map(cast.map((name) => [name, drawer(VOICES[name], random)]));
    let text = lines.join("\n");
    let turn = 0;
    while (sceneLineCount(text) < target && turn < 60) {
      const speaker = cast[turn % cast.length];
      const other = cast[(turn + 1) % cast.length];
      lines.push("", speaker.toUpperCase(), fill(voices.get(speaker)(), { O: first(other), S: subject }));
      if (turn % 4 === 3) lines.push("", fill(business(), { A: first(speaker), B: first(other), S: subject }));
      turn += 1;
      text = lines.join("\n");
    }
  }
  lines.push("", `${spec.change}.`);
  return lines.join("\n");
}

// --- Build ----------------------------------------------------------------------

function apply(state, command) {
  const out = applyCommand(state, command, now());
  return out;
}

function buildBoard(episode, index, roster, folds) {
  let state = { ...emptyState(), characters: roster };
  ({ state } = apply(state, { type: "set_logline", logline: episode.logline }));
  ({ state } = apply(state, { type: "set_target", kind: "hour" }));
  const random = seeded(1000 + index);
  const byName = new Map(roster.map((person) => [person.name, person.id]));
  const spineBySlot = new Map(episode.spine.map((scene) => [scene[0], scene]));
  const people = roster.map((person) => person.name).filter((name) => index < 2 || name !== "Kit Fenn");
  const ids = [];
  const marks = [];
  for (let slot = 1; slot <= 40; slot += 1) {
    const spine = spineBySlot.get(slot);
    let spec;
    let extra = {};
    let beat = false;
    if (spine) {
      const [, headline, change, place, when, cast, isBeat, more] = spine;
      spec = { headline, change, place, when, cast };
      beat = Boolean(isBeat);
      extra = more ?? {};
    } else {
      // A different template for every filler on a board, and a different rotation on every board.
      const template = FILLERS[(slot + index * 5) % FILLERS.length];
      const [headline, change, place, when, slots] = template;
      // Nobody plays against themself: a template that names a person keeps them out of A and B.
      const named = roster.map((person) => person.name).filter((name) => (headline + " " + change).includes(first(name)));
      const pool = people.filter((name) => !named.includes(name));
      const a = pool[Math.floor(random() * pool.length)];
      let b = pool[Math.floor(random() * pool.length)];
      if (b === a) b = pool[(pool.indexOf(a) + 1) % pool.length];
      const subject = episode.subjects[slot % episode.subjects.length];
      const vars = { A: first(a), B: first(b), S: subject };
      const cast = [];
      if (slots >= 1) cast.push(a);
      if (slots >= 2) cast.push(b);
      for (const person of roster) if ((headline + " " + change).includes(first(person.name)) && !cast.includes(person.name)) cast.push(person.name);
      // The café's rush and the counter keep Kit in the room after episode two, saying nothing of leaving.
      if (place === "cafe" && index >= 2 && !cast.includes("Kit Fenn")) cast.push("Kit Fenn");
      spec = { headline: fill(headline, vars), change: fill(change, vars), place, when, cast };
    }
    // Second acts run long on purpose (slots 11–30): a page and three quarters against a page and a quarter.
    const pages = beat ? 2 : slot > 10 && slot <= 30 ? 1.75 : 1.25;
    const subject = episode.subjects[slot % episode.subjects.length];
    const text = sceneText(spec, subject, pages, random);
    const row = Math.floor((slot - 1) / 8);
    const col = (slot - 1) % 8;
    const { state: next, result } = apply(state, {
      type: "create_note",
      headline: spec.headline,
      change: spec.change,
      rank: beat ? "beat" : "scene",
      characterIds: spec.cast.map((name) => byName.get(name)).filter(Boolean),
      location: `${INTERIOR.has(spec.place) ? "INT." : "EXT."} ${PLACES[spec.place]}`,
      when: spec.when,
      x: 40 + col * 230,
      y: 40 + row * 230,
      rotate: 0,
      text,
      ...(extra.plant ? { plantsWhat: extra.plant } : {}),
    });
    state = next;
    ids.push(result.id);
    if (extra.key) folds.set(extra.key, { boardIndex: index, noteId: result.id, promise: extra.promise });
    if (extra.payoff) marks.push({ noteId: result.id, key: extra.payoff });
  }
  for (let i = 1; i < ids.length; i += 1) ({ state } = apply(state, { type: "create_arrow", from: ids[i - 1], to: ids[i], kind: "follows" }));
  ({ state } = apply(state, { type: "create_group", noteIds: ids.slice(0, 10), title: "Act One" }));
  ({ state } = apply(state, { type: "create_group", noteIds: ids.slice(10, 30), title: "Act Two" }));
  ({ state } = apply(state, { type: "create_group", noteIds: ids.slice(30), title: "Act Three" }));
  return { state, ids, marks };
}

function main() {
  const outPath = path.resolve(process.argv[2] ?? "low-water.json");
  let project = emptyProject(now());
  project = renameProject(project, "Low Water", now());
  project = setPremise(project, "A harbour town on a sand footing, and the family that has signed for it for three generations, over the six weeks between the first crack in the sea wall and the equinox tide that takes it.", now());
  project = setTitlePage(project, { author: "Robert Douglas", contact: "" }, now());
  project = renameBoard(project, project.boards[0].id, EPISODES[0].name, now());
  for (const episode of EPISODES.slice(1)) ({ project } = addBoard(project, episode.name, now()));
  project = setActiveBoard(project, project.boards[0].id, now());

  // One cast, built on the first board through the kernel and lifted onto the project.
  let seed = emptyState();
  for (const [name, looks, voice, wants, needs, notes] of CAST) {
    const { state, result } = apply(seed, { type: "add_character", name });
    ({ state: seed } = apply(state, { type: "update_character", id: result.id, looks, voice, wants, needs, notes }));
  }
  project = { ...project, characters: seed.characters };
  const roster = project.characters;

  const boards = {};
  const folds = new Map();
  const built = [];
  for (const [index, episode] of EPISODES.entries()) {
    const meta = project.boards[index];
    const { state, ids, marks } = buildBoard(episode, index, roster, folds);
    boards[meta.id] = state;
    built.push({ meta, ids, marks });
  }
  // Folds that pay off on another board: the receiving scene named on the fold; a promise names the board alone.
  for (const [key, fold] of folds) {
    const payer = built.flatMap((board, boardIndex) => board.marks.filter((mark) => mark.key === key).map((mark) => ({ boardIndex, noteId: mark.noteId })))[0];
    const foldMeta = built[fold.boardIndex].meta;
    if (payer && payer.boardIndex === fold.boardIndex) {
      ({ state: boards[foldMeta.id] } = apply(boards[foldMeta.id], { type: "create_arrow", from: fold.noteId, to: payer.noteId, kind: "setup" }));
    } else if (payer) {
      ({ state: boards[foldMeta.id] } = apply(boards[foldMeta.id], { type: "set_payoff_board", ids: [fold.noteId], boardId: built[payer.boardIndex].meta.id, noteId: payer.noteId }));
    } else if (typeof fold.promise === "number") {
      ({ state: boards[foldMeta.id] } = apply(boards[foldMeta.id], { type: "set_payoff_board", ids: [fold.noteId], boardId: built[fold.promise].meta.id }));
    }
    // else: the fold stays open — the brass key.
  }
  for (const meta of project.boards) {
    const merged = mergeRoster(project, boards[meta.id], now());
    project = merged.project;
    boards[meta.id] = withRoster(merged.state, project);
  }

  const file = toProjectFile({ project, boards, exportedAt: AT });
  fs.writeFileSync(outPath, `${JSON.stringify(file)}\n`);
  const cards = Object.values(boards).reduce((sum, state) => sum + state.notes.length, 0);
  const written = Object.values(boards).reduce((sum, state) => sum + state.notes.filter((note) => note.text.trim()).length, 0);
  const bytes = fs.statSync(outPath).size;
  console.log(`Wrote "${project.name}": ${project.boards.length} boards, ${cards} cards, ${written} written, ${roster.length} in the cast, ${folds.size} folds — ${bytes} bytes at ${outPath}`);
}

main();

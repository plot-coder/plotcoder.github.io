# Round four — the account door

Paste everything below the line into a fresh agent session. Fill in the two
credentials yourself; never put them in this file.

---

You are working as a screenwriter's agent on PlotCoder, a storyline wall that
lives at plotcoder.com. I am the writer. You operate the app; I direct.

Before anything else, read this and only this:

    https://plotcoder.com/llms.txt

## Your way in

You are working **my account**, not a wall on your own machine. There is no dev
server running and there will not be one. Nothing you build lives in a folder.

The MCP server you need is in the repo, so clone it — you need it only to run
the server:

```bash
git clone https://github.com/plot-coder/plotcoder.github.io
cd plotcoder.github.io
npm ci
```

Wire the server the way the on-ramp tells you, with these two in its
environment:

    PLOTCODER_EMAIL=<I will give you this>
    PLOTCODER_PASSWORD=<I will give you this>

Do not run `npm run dev`. Do not open the app in a browser. Work the account.

Before you build anything, start a project of your own with `new_project`, so
nothing you do touches my other work.

## What I want you to do

1. Make the calls the on-ramp tells you to make first, before you change
   anything.
2. Read the treatment at the end of this message.
3. Build it as a wall — the scenes as cards, the major turns marked, the cast,
   the places, the arrows, the acts, the episode's central question, and the
   series premise above it.
4. Read the wall back to me: what is there, and what it asks.
5. **Stop there.** Do not write scene text, do not paginate, do not export, do
   not print.

Ask me about anything the treatment does not say. I would rather answer four
questions than read four inventions.

## What I do not want you to do

- **Do not fix, edit or improve PlotCoder.** You are using the app, not building
  it. No commits, no pull requests, no edits to any file in that repo.
- **Do not read `REQUIREMENTS.md` or `CLAUDE.md`.** They would tell you what the
  app intends. I want to know what it actually does for someone who arrived with
  only the on-ramp.
- Do not drive the app by faking mouse or keyboard input. Call the tools.
- Do not invent a person, a logline, or any fact the treatment does not state.

## The report I want at the end

When you stop, hand me one report and make it the only thing you hand back.

1. **What you built.** A sentence or two.
2. **The friction log.** Every place the app, the on-ramp, the guide, a tool's
   description or a tool's reply made you slower, made you guess, made you
   backtrack, or left you unsure whether what you intended had actually landed.
   Number them. For each one: what you were trying to do, what happened, and what
   you expected instead. Include the small ones — a word that read two ways, a
   reply that did not say what it had done. Do not rank them and do not fix them;
   that is my job.
3. **Could you have got here without cloning the repo?** Say plainly what you had
   to work out that the on-ramp did not tell you.
4. **What you never found a way to do at all.**

Be blunt. A polite log is a useless log — I am going to act on this, and
anything you smooth over is something I will not fix.

---

## The treatment

<paste the contents of blind-runs/round-four-treatment.md here>

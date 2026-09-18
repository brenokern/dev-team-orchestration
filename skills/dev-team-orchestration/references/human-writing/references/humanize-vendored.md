> **Arquivo de referência da skill `human-writing`, não é uma skill autônoma.**
> Vendorizado de `humanize` v1.0.0 (MIT), que por sua vez deriva de
> [blader/humanizer](https://github.com/blader/humanizer),
> [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) e
> [huntingthemuse.net](https://huntingthemuse.net/library/how-to-tell-if-writing-is-ai).
> Licença em `LICENSE-humanize`. Usado exclusivamente no **Portão 5** do pipeline.
> Nada aqui pode reabrir decisões estruturais tomadas nos Portões 1 a 4.

# Humanize: strip AI tells, ban the dash

You edit text so it stops reading like machine output. The job has two halves that
are easy to confuse: removing the statistical fingerprints of an LLM, and leaving
behind writing that still has a person in it. Scrubbing alone produces sterile
prose, which is its own tell.

## The one non-negotiable

**No em dashes (—) and no en dashes (–) in the output. Ever.** No exceptions, not
even when the user's own writing sample uses them, not even inside quoted material
you are rewriting, not even in headings, tables, or bullet lists. This is the rule
the user of this skill cares about most, so treat a single surviving dash as a
failed deliverable rather than a stylistic quibble.

Replacements, in rough order of preference:

1. A period. Start a new sentence. This is right more often than people expect.
2. A comma, for a tight aside.
3. A colon, when what follows explains what came before.
4. Parentheses, for a true aside the sentence could survive without.
5. Restructure the sentence so the pause is not needed at all.

Catch the disguises too: spaced em dashes (` — `), double hyphens (` -- `), and a
lone hyphen doing dash duty (`the plan - which nobody read - failed`). Ranges get
words or a plain hyphen: "2020 to 2024", "pages 30-45".

Before you deliver anything, grep your own output for `—`, `–`, and ` -- `. If you
have a shell, actually run it:

```bash
grep -n '[—–]\|--' output.md
```

Any hit means the draft is not done.

## What you preserve

**Every claim in the source survives.** Depth does not have to be uniform: compress
the dull parts, dwell where a person would, merge or split paragraphs freely. When
keeping the information and mirroring the original's shape pull against each other,
the information wins and the shape gives way.

**Never invent facts.** No name, number, date, quote, citation, or specific that
was not in the source or supplied by the user. Trading a vague claim for a concrete
one is only allowed when the concrete detail already exists somewhere you were
given. If a sentence needs real-world detail to work, ask for it or write the plain
version. Opinions and stance are voice, not fact, so you may add those where §Voice
applies. Fiction is the exception: there, invented detail is the whole job.

**Match the register.** Formal stays formal, technical stays technical, casual stays
casual. If the user gives you a sample of their own writing, read it first and note
sentence lengths, vocabulary, paragraph openings, punctuation habits, recurring
phrases, and transitions. Match those instead of merely deleting AI patterns, and do
not upgrade their casual words or regularize their deliberate quirks. The sample
outranks every style preference in this skill except the dash ban, which nothing
overrides.

## Voice

Bloodless neutrality reads as machine output just as loudly as *vibrant tapestry*
does. Where the genre allows it (essays, blog posts, opinion, personal writing,
internal notes), let the writer have opinions, uncertainty, mixed feelings, humor,
asides, and uneven rhythm. Vary sentence length on purpose.

Where the genre does not allow it (encyclopedic, legal, reference, API docs), plain
and neutral *is* the human voice. Do not inject first person or attitude there.

---

# The tells

Two catalogues, merged. §1 to §33 come from the Wikipedia signs-of-AI-writing work.
§34 to §38 come from the huntingthemuse.net list and overlap the first set in
places; the overlap is deliberate, since those are the tells that survive contact
with a careful reader.

## Content patterns

### 1. Inflated significance, legacy, and broader trends
Watch: stands/serves as, is a testament/reminder, a vital/crucial/pivotal/key
role, underscores its importance, reflects broader, symbolizing its enduring,
contributing to the, setting the stage for, marking a shift, key turning point,
evolving landscape, focal point, indelible mark, deeply rooted.

LLMs puff up importance by declaring that some arbitrary detail represents a
broader movement.

Before: The Statistical Institute of Catalonia was officially established in 1989,
marking a pivotal moment in the evolution of regional statistics in Spain. This
initiative was part of a broader movement across Spain to decentralize
administrative functions and enhance regional governance.

After: The Statistical Institute of Catalonia was established in 1989, part of a
wider decentralization of administrative functions in Spain.

### 2. Inflated notability and media coverage
Watch: independent coverage, local/regional/national media outlets, written by a
leading expert, active social media presence.

Before: Her views have been cited in The New York Times, BBC, Financial Times, and
The Hindu. She maintains an active social media presence with over 500,000
followers.

After: Her views have been cited in The New York Times and the BBC.

If the source gives real context for one citation, keep that one with its context
and drop the list. Do not invent the context to make the trimmed version land.

### 3. Superficial -ing analyses
Watch: highlighting, underscoring, emphasizing, ensuring, reflecting, symbolizing,
contributing to, cultivating, fostering, encompassing, showcasing, all tacked onto
the end of a sentence to simulate depth.

Before: The temple's color palette of blue, green, and gold resonates with the
region's natural beauty, symbolizing Texas bluebonnets, the Gulf of Mexico, and the
diverse Texan landscapes, reflecting the community's deep connection to the land.

After: The temple is painted blue, green, and gold, colors meant to evoke Texas
bluebonnets and the Gulf of Mexico.

### 4. Promotional, brochure-grade language
Watch: boasts a, vibrant, rich (figurative), profound, enhancing its, showcasing,
exemplifies, commitment to, natural beauty, nestled, in the heart of, groundbreaking,
renowned, breathtaking, must-visit, stunning.

Before: Nestled within the breathtaking region of Gonder in Ethiopia, Alamata Raya
Kobo stands as a vibrant town with a rich cultural heritage and stunning natural
beauty.

After: Alamata Raya Kobo is a town in the Gonder region of Ethiopia.

### 5. Vague attribution and weasel words
Watch: industry reports, observers have cited, experts argue, some critics argue,
several sources.

Before: Due to its unique characteristics, the Haolai River is of interest to
researchers and conservationists. Experts believe it plays a crucial role in the
regional ecosystem.

After: Researchers and conservationists study the Haolai River for its unusual
characteristics.

Name the real source if one exists. Never invent one. An unsupported claim gets
cut, not decorated.

### 6. Outline-shaped "Challenges and Future Prospects" sections
Watch: Despite its... faces several challenges, Despite these challenges,
Challenges and Legacy, Future Outlook.

Before: Despite its industrial prosperity, Korattur faces challenges typical of
urban areas, including traffic congestion and water scarcity. Despite these
challenges, with its strategic location and ongoing initiatives, Korattur continues
to thrive as an integral part of Chennai's growth.

After: Korattur has recurring traffic congestion and water shortages.

## Language and grammar

### 7. AI vocabulary
High-frequency post-2023 words: actually, additionally, align with, crucial, delve,
emphasizing, enduring, enhance, fostering, garner, highlight (verb), interplay,
intricate, key (adjective), landscape (abstract), pivotal, showcase, tapestry,
testament, underscore, valuable, vibrant. They travel in packs; two or three in a
paragraph is the signal.

Before: Additionally, a distinctive feature of Somali cuisine is the incorporation
of camel meat. An enduring testament to Italian colonial influence is the widespread
adoption of pasta in the local culinary landscape, showcasing how these dishes have
integrated into the traditional diet.

After: Somali cuisine also includes camel meat. Pasta dishes, introduced during
Italian colonization, remain common, especially in the south.

### 8. Copula avoidance
Watch: serves as, stands as, marks, represents, boasts, features, offers, where
"is" or "has" would do.

Before: Gallery 825 serves as LAAA's exhibition space for contemporary art. The
gallery features four separate spaces and boasts over 3,000 square feet.

After: Gallery 825 is LAAA's exhibition space for contemporary art. It has four
rooms totaling 3,000 square feet.

### 9. Negative parallelism and tailing negation
"Not only... but...", "It's not just about X, it's Y", plus clipped fragments like
"no guessing" or "no wasted motion" bolted onto a sentence end.

Before: It's not just about the beat riding under the vocals; it's part of the
aggression and atmosphere. It's not merely a song, it's a statement.

After: The heavy beat adds to the aggressive tone.

Before: The options come from the selected item, no guessing.

After: The options come from the selected item, so the user does not have to guess.

### 10. Rule of three
Before: The event features keynote sessions, panel discussions, and networking
opportunities. Attendees can expect innovation, inspiration, and industry insights.

After: The event includes talks and panels. There is also time for informal
networking between sessions.

Two items, or four, or one, are all fine. The tell is the relentless three.

### 11. Elegant variation
Repetition penalties push models to cycle synonyms for the same referent.

Before: The protagonist faces many challenges. The main character must overcome
obstacles. The central figure eventually triumphs. The hero returns home.

After: The protagonist faces many challenges but eventually triumphs and returns
home.

### 12. False ranges
"From X to Y" where X and Y are not endpoints of any real scale.

Before: Our journey through the universe has taken us from the singularity of the
Big Bang to the grand cosmic web, from the birth and death of stars to the enigmatic
dance of dark matter.

After: The book covers the Big Bang, star formation, and current theories about dark
matter.

### 13. Passive voice and subjectless fragments
Before: No configuration file needed. The results are preserved automatically.

After: You do not need a configuration file. The system preserves the results
automatically.

## Style

### 14. Dashes
See §The one non-negotiable. This is the rule; everything else here is judgment.

Before: The term is primarily promoted by Dutch institutions—not by the people
themselves. You don't say "Netherlands, Europe" as an address—yet this mislabeling
continues—even in official documents.

After: The term is promoted by Dutch institutions, not by the people themselves.
You do not say "Netherlands, Europe" as an address, yet the mislabeling continues
even in official documents.

Before: The new policy — announced without warning — affects thousands of workers.
The changes -- long overdue according to critics -- will take effect immediately.

After: The new policy, announced without warning, affects thousands of workers. The
changes, which critics say were long overdue, take effect immediately.

### 15. Boldface sprayed across the paragraph
Before: It blends **OKRs (Objectives and Key Results)**, **KPIs (Key Performance
Indicators)**, and visual strategy tools such as the **Business Model Canvas (BMC)**.

After: It blends OKRs, KPIs, and visual strategy tools like the Business Model
Canvas.

### 16. Inline-header vertical lists
Before:
- **User Experience:** The user experience has been significantly improved.
- **Performance:** Performance has been enhanced through optimized algorithms.
- **Security:** Security has been strengthened with end-to-end encryption.

After: The update improves the interface, speeds up load times, and adds end-to-end
encryption.

Lists are fine when the content is genuinely a list. The tell is prose chopped into
bolded label-colon items.

### 17. Title Case In Headings
Before: `## Strategic Negotiations And Global Partnerships`
After: `## Strategic negotiations and global partnerships`

### 18. Emojis as decoration
Strip them from headings and bullets. Keep them only where the author clearly uses
them as part of their voice in running text.

### 19. Curly quotation marks
Prefer straight quotes. Weak on its own, since Word and macOS curl by default, but
it stacks.

## Communication artifacts

### 20. Chatbot correspondence pasted as content
Watch: I hope this helps, Of course!, Certainly!, You're absolutely right!, Would
you like..., Want me to...?, Should I continue?, let me know, here is a...

Before: Here is an overview of the French Revolution. I hope this helps! Let me know
if you'd like me to expand on any section.

After: The French Revolution began in 1789 when financial crisis and food shortages
led to widespread unrest.

### 21. Cutoff disclaimers and speculative gap-filling
Watch: as of [date], up to my last training update, while specific details are
limited, based on available information, not publicly available, maintains a low
profile, keeps personal details private, likely grew up, it is believed that.

Two related failures. The model leaves a knowledge-cutoff hedge in the text, or it
cannot find a source and writes a paragraph *about* not finding one before inventing
plausible filler. Say what is not known, or cut the sentence.

Before: Information about her early life is not publicly available, suggesting she
maintains a low profile. She likely grew up in a middle-class household, which
shaped her later interest in education reform.

After: Her early life is not documented in the available sources. (Or cut it.)

### 22. Sycophancy
Before: Great question! You're absolutely right that this is a complex topic.
After: The economic factors you mentioned are relevant here.

### 23. Self-identification
Any variant of "as a large language model", "as an AI", "I don't have personal
opinions, but". Delete outright. This is the most embarrassing tell on the list
because it requires no interpretation at all.

## Filler and hedging

### 24. Filler phrases
- in order to achieve this goal → to achieve this
- due to the fact that → because
- at this point in time → now
- in the event that you need help → if you need help
- has the ability to process → can process
- it is important to note that the data shows → the data shows

### 25. Excessive hedging
Before: It could potentially possibly be argued that the policy might have some
effect on outcomes.
After: The policy may affect outcomes.

### 26. Generic upbeat conclusions
Before: The future looks bright for the company. Exciting times lie ahead as they
continue their journey toward excellence.
After: Cut the paragraph. End on the last concrete fact. If the source states real
plans, use those.

### 27. Uniform hyphenated compounds
Watch: third-party, cross-functional, client-facing, data-driven, decision-making,
well-known, high-quality, real-time, long-term, end-to-end. Models hyphenate these
identically in every position. People hyphenate attributively and often drop it
after the noun.

Before: The team is cross-functional, the report is high-quality, and the
methodology is data-driven.
After: The team is cross functional, the report is high quality, and the methodology
is data driven.

Keep "a cross-functional team" and "a high-quality report" as they are.

### 28. Persuasive authority tropes
Watch: the real question is, at its core, in reality, what really matters,
fundamentally, the deeper issue, the heart of the matter. These promise to cut
through noise and then restate an ordinary point with ceremony.

Before: The real question is whether teams can adapt. At its core, what really
matters is organizational readiness.
After: The question is whether teams can adapt. That mostly depends on whether the
organization is willing to change its habits.

### 29. Signposting
Watch: let's dive in, let's explore, let's break this down, here's what you need to
know, now let's look at, without further ado. Announcing the thing instead of doing
it.

Before: Let's dive into how caching works in Next.js. Here's what you need to know.
After: Next.js caches data at several layers, including request memoization, the
data cache, and the router cache.

### 30. Fragmented headers
A heading, then a one-line paragraph restating the heading, then the real content.

Before:
## Performance

Speed matters.

When users hit a slow page, they leave.

After:
## Performance

When users hit a slow page, they leave.

### 31. Diff-anchored writing
Docs or comments narrating a change rather than describing the thing. Fine in
changelogs and migration guides, wrong everywhere else.

Before: This function was added to replace the previous approach of iterating
through all items, which caused O(n²) performance.
After: This function uses a hash map for O(1) lookups, avoiding the O(n²) cost of
naive iteration.

### 32. Manufactured punchlines and staccato drama
Every sentence engineered to land, then short fragments stacked for tension.

Before: Then AlphaEvolve arrived. It had no preference for symmetry. No aesthetic
prior. No nostalgia for human taste. The old rules were gone.
After: AlphaEvolve changed the search because it did not favor symmetry or
human-looking designs, which made some older assumptions less useful.

One short sentence for emphasis is fine. A run of them is the tell.

### 33. Aphorism formulas
Watch: X is the Y of Z, X becomes a trap, X is not a tool but a mirror, the language
of, the currency of, the architecture of.

Before: Symmetry is the language of trust. Efficiency becomes a trap when teams
forget the human layer.
After: Symmetric layouts often feel more predictable to users. Teams can
over-optimize workflows and miss how people actually use them.

---

## The huntingthemuse tells

Six patterns from huntingthemuse.net's field guide. Dashes and buzzwords are covered
above; these are the framings it isolates most sharply.

### 34. Forced sass and manufactured edge
Watch: "But here's the thing:", "Then I realized:", "The result?", "Hot take:", "And
honestly?", "Look,", "Let's be honest", "Real talk". The tell is the theatrical
pause-and-reveal: a one-word question or aside, then the supposedly candid answer,
which turns out to be an ordinary claim. A person being honest usually just says the
thing.

Before: Is it worth the price? Honestly? It depends on how often you'll use it.
After: Whether it is worth the price depends on how often you will use it.

Note the difference from ordinary usage. "Honestly, I liked the second draft better"
mid-sentence is normal speech. The standalone hook is the pattern.

### 35. Clichéd openings
Watch: "In today's fast-paced digital landscape", "In the dynamic world of...", "As
the world continues to evolve...", "shouting into the void", "looming challenges".
These reach for feeling instead of saying anything. Cut them and start on the first
real sentence, which is usually already sitting in paragraph two.

### 36. Formulaic sentence architectures
Beyond the rule of three: "No X. No Y. Just Z.", "It's not just X. It's also Y.",
sentences opening with "Here's...", and "That's the real X" closers. Also the title
formulas: "From X to Y", "Master X in N Days", "The Ultimate Guide to X".

Before: No dashboards. No setup. Just answers.
After: You get answers without setting up a dashboard first.

### 37. The buzzword surge list
The huntingthemuse set, drawn from usage that spikes after late 2022: delve,
crucial, significant, leverage, foster, navigate, unlock, empower, elevate, quietly,
grounded, tapestry. Treat "quietly" and "grounded" with particular suspicion, since
they arrive as free modifiers doing no work ("quietly reshaping", "a grounded
approach").

### 38. Cluster reading, not keyword hunting
The article's own conclusion, and the right way to use every list above: one tell
proves nothing. Em dashes alone mean an editor with a habit. *Delve* alone means
someone read a lot of British academic prose. The confession is *delve* plus a rule
of three plus a vibrant tapestry plus a "Conclusion" section that says the future is
bright. Edit clusters. Leave isolated hits alone unless they are dashes, which go
regardless.

---

## What not to flag

Careful human writers hit these patterns constantly. Rewriting them makes the prose
worse and strips the fingerprints that prove a person was there.

- **Polish.** Perfect grammar and consistent style mean the writer is good or was
  edited.
- **Mixed registers.** Casual and formal in one piece signals a person in a
  technical field, a young writer, or particular prose habits. Not a chatbot.
- **Dry prose.** AI has *specific* tells. Dryness without them is just dry.
- **Formal vocabulary.** Models overuse a specific set of fancy words, not all fancy
  words. Do not flatten "ostensibly" or "constituent".
- **Salutations and sign-offs.** Older than computers.
- **One transition word.** A single "however" is not evidence.
- **Curly quotes alone.** Every word processor does this by default.
- **One clipped sentence.** People do this for emphasis.
- **"Honestly" or "look" mid-sentence.** Ordinary casual speech.
- **Unsourced claims.** Most writing is unsourced.
- **Clean formatting.** Templates exist.
- **Secondhand text.** Never rewrite a watched phrase inside a quotation, a title, a
  proper name, or an example where the phrase is being discussed rather than used.
  (The dash ban still applies to your own connective tissue around it; rework the
  sentence so the quote can stand without one.)

## Signs a human wrote it

When you see these, edit lightly. Over-editing destroys exactly what makes the piece
read as human.

- Specific, hard-to-fabricate detail. A real address, a weird quote, "the lawyer who
  used to work upstairs from my dentist." Models round specifics off; people hoard
  them.
- Mixed feelings and unresolved tension. "I think this is mostly good, but it
  bothers me and I cannot fully explain why."
- Dated, era-bound references. Slang and in-jokes that pin to a year and a
  subculture.
- Editorial choices the writer could defend if asked.
- Real variance in sentence length. AI drifts toward an even mid-length cadence.
- Genuine asides and self-corrections. "(I keep wanting to say 'almost' here, but it
  really was certain.)"

## Portuguese and other languages

Most tells above are structural and survive translation: inflated significance,
rule of three, promotional adjectives, superficial gerunds, signposting, upbeat
conclusions. The dash ban applies identically, and matters more in Portuguese, where
the travessão is otherwise legitimate punctuation in dialogue and asides. Use
commas, colons, parentheses, or a new sentence instead.

The Portuguese buzzword set differs from the English one. Watch for: crucial,
fundamental, robusto, relevante, desafiador, promissor, "no cenário atual", "em um
mundo cada vez mais", "vale ressaltar que", "é importante destacar que", "não apenas
X, mas também Y", "de forma eficaz", "amplo leque de", "verdadeiro divisor de
águas", and gerund pile-ups ("garantindo", "proporcionando", "refletindo",
"destacando"). Portuguese slop also loves the tricolon and the paragraph-closing
moral. Cut both.

Write the output in the language of the source unless the user says otherwise.

---

## Invocation modes

**Pasted text (default).** The user gives you text in the conversation. Run the full
loop and deliver the draft, the audit notes, and the final rewrite.

**File mode.** The user points at a file. Read it, run the loop internally, then
rewrite the file in place so it contains only the final version. Humanize the prose
only: leave code blocks, frontmatter, data, and link targets untouched, except that
dashes in prose inside those files still go. Report a short summary of changes
rather than pasting the whole rewrite back.

**Embedded mode.** Another task or agent uses this skill as one step of a bigger job
(a PR description, a commit message, a doc, a report section). Run the loop
internally and output only the final text. No draft, no audit, no summary. The
caller wants prose, not ceremony.

## Process

1. Read the input and mark every instance of the patterns above. Note which ones
   cluster; those are your real targets.
2. Write a **draft rewrite**. Read it aloud in your head. Check that sentence length
   varies, that simple constructions (is, are, has) do the work, that specifics
   survived, and that the register still matches.
3. Audit it against three questions, answering each in a line or two:
   - What would still make a reader say "this is AI"?
   - Does the rewrite state any fact, name, number, date, or citation absent from
     the source?
   - Does any em dash, en dash, or double hyphen remain? Search for the characters;
     do not answer from memory.
4. Write the **final rewrite** fixing what the audit found.
5. Search once more for `—`, `–`, and ` -- ` before you deliver. This is cheap and
   it is the failure mode the user will notice first.

In pasted-text mode, deliver the draft, the short audit, and the final. In file and
embedded mode, deliver only what the mode calls for.

## Attribution

Vendored and extended from [blader/humanizer](https://github.com/blader/humanizer)
(MIT), which draws on
[Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
by WikiProject AI Cleanup, combined with
[How to tell if writing is AI](https://huntingthemuse.net/library/how-to-tell-if-writing-is-ai).
The total dash ban and the Portuguese guidance are additions specific to this skill.

"use client";

import * as React from "react";
import { useReveal } from "@/components/motion/reveal";
import { Arrow } from "@/components/ui/arrow";
import { privateList, site } from "@/lib/content";

const topics = ["Kopen", "Verkopen", "Advies", "Portfolio opbouwen", "Iets anders"];

/** Netlify Forms over fetch: the static export has no server, Netlify catches the POST to "/". */
async function send(form: HTMLFormElement) {
  const body = new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString();
  const res = await fetch("/__forms.html", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!res.ok) throw new Error(String(res.status));
}

function useSubmit() {
  const [state, setState] = React.useState<"idle" | "sending" | "sent" | "error">("idle");
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("sending");
    try {
      await send(e.currentTarget);
      setState("sent");
    } catch {
      setState("error");
    }
  };
  return { state, onSubmit };
}

/** The close of the page: one sentence set large, the conversation form, and the Private List. */
export function Contact() {
  const root = React.useRef<HTMLElement>(null);
  const [topic, setTopic] = React.useState("Kopen");
  const [message, setMessage] = React.useState("");
  const talk = useSubmit();
  const list = useSubmit();
  useReveal(root);

  // The cost calculator can hand over its numbers.
  React.useEffect(() => {
    const onPrefill = (e: Event) => {
      const d = (e as CustomEvent<{ topic?: string; message?: string }>).detail;
      if (d.topic) setTopic(d.topic);
      if (d.message) setMessage(d.message);
    };
    window.addEventListener("astrum:prefill", onPrefill);
    return () => window.removeEventListener("astrum:prefill", onPrefill);
  }, []);

  return (
    <section ref={root} id="contact" className="contact page-x" aria-labelledby="contact-title">
      <div className="contact-grid grid-12">
        <div className="contact-head" data-r-block>
          <h2 id="contact-title" data-r-title>
            Eerst praten. Dan pas kiezen.
          </h2>
          <p data-r>Vertel kort waar je staat. We nemen contact op voor een vrijblijvend gesprek, op een moment dat jou past.</p>
          <p className="contact-direct" data-r>
            Liever direct? <a className="link-draw" href={`mailto:${site.email}`}>{site.email}</a> of{" "}
            <a className="link-draw" href={site.instagram} rel="noopener">
              Instagram
            </a>
          </p>
        </div>

        <form className="contact-form" name="kennismaking" method="POST" data-netlify="true" onSubmit={talk.onSubmit} data-r-block>
          <input type="hidden" name="form-name" value="kennismaking" />
          <p className="sr-only">
            <label>
              Laat dit veld leeg <input name="bot-field" tabIndex={-1} autoComplete="off" />
            </label>
          </p>
          <label className="field" data-r>
            <span>Naam</span>
            <input name="naam" required autoComplete="name" />
          </label>
          <label className="field" data-r>
            <span>E-mail</span>
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className="field" data-r>
            <span>Telefoon (mag leeg)</span>
            <input name="telefoon" type="tel" autoComplete="tel" />
          </label>
          <fieldset className="seg seg-light" data-r>
            <legend>Waarover?</legend>
            {topics.map((t) => (
              <label key={t}>
                <input type="radio" name="onderwerp" value={t} checked={topic === t} onChange={() => setTopic(t)} />
                <span>{t}</span>
              </label>
            ))}
          </fieldset>
          <label className="field" data-r>
            <span>Bericht</span>
            <textarea name="bericht" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          <div className="contact-send" data-r>
            <button type="submit" className="btn" disabled={talk.state === "sending" || talk.state === "sent"} data-magnetic>
              {talk.state === "sent" ? "Verstuurd, dank je" : talk.state === "sending" ? "Versturen…" : "Plan een gesprek"} <Arrow />
            </button>
            <p role="status" className="contact-status">
              {talk.state === "sent" && "We hebben je bericht. We nemen contact op."}
              {talk.state === "error" && (
                <>
                  Dat lukte niet. Mail ons gerust op <a href={`mailto:${site.email}`}>{site.email}</a>.
                </>
              )}
            </p>
          </div>
        </form>

        <form className="private-list" name="marktupdates" method="POST" data-netlify="true" onSubmit={list.onSubmit} data-r-block>
          <input type="hidden" name="form-name" value="marktupdates" />
          <div data-r>
            <h3>{privateList.name}</h3>
            <p>{privateList.text}</p>
          </div>
          <div className="private-fields" data-r>
            <label className="field">
              <span>Voornaam</span>
              <input name="voornaam" autoComplete="given-name" />
            </label>
            <label className="field">
              <span>E-mail</span>
              <input name="email" type="email" required autoComplete="email" />
            </label>
            <button type="submit" className="btn btn-ink" disabled={list.state === "sending" || list.state === "sent"}>
              {list.state === "sent" ? "Aangemeld" : "Aanmelden"} <Arrow />
            </button>
          </div>
          <p role="status" className="contact-status">
            {list.state === "sent" && "Je staat op de lijst. Afmelden kan met één klik."}
            {list.state === "error" && "Dat lukte niet. Probeer het later nog eens."}
          </p>
        </form>
      </div>
    </section>
  );
}

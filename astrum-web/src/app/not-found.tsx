import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-page grid gap-8 pt-24 pb-40">
      <h1 className="text-head">Deze pagina bestaat niet</h1>
      <p className="measure text-lead">De link is misschien verouderd. Begin op de homepage, of kijk wat kopen in Dubai echt kost.</p>
      <div className="flex flex-wrap gap-6">
        <Link href="/" className="link">Naar de homepage</Link>
        <Link href="/kosten/" className="link">Naar de kostencalculator</Link>
      </div>
    </section>
  );
}

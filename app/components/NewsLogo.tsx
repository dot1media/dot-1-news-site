// The Dot 1 News mark (animated globe built into the "1") in place of the literal "1".
// Sized to the surrounding text via em; a static PNG is shown when reduced motion is preferred.
export default function NewsLogo({ h = "1.15em" }: { h?: string | number }) {
  return (
    <picture aria-label="1" role="img" style={{ display: "inline-block", height: h, verticalAlign: "-0.22em", lineHeight: 0, margin: "0 0.02em" }}>
      <source srcSet="/news-logo.png" media="(prefers-reduced-motion: reduce)" />
      <img src="/news-logo.gif" alt="1" style={{ height: "100%", width: "auto", display: "block" }} />
    </picture>
  );
}

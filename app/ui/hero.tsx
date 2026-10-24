import { Sock } from "./sock";

export function Hero({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="hero">
      <Sock />
      <div className="hero-text">
        <span className="hero-kicker">{kicker}</span>
        <h1 className="hero-title">{title}</h1>
      </div>
    </div>
  );
}

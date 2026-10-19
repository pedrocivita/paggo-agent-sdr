import { Suspense } from "react";
import { submitLead } from "./actions";
import { ROLES } from "@/lib/roles";

// The research runs inside this page's server action, so it needs room to finish.
export const maxDuration = 120;

async function FormError({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return erro ? <p className="note err">Preencha nome completo, e-mail, telefone, cargo e empresa, e marque o aceite.</p> : null;
}

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main>
      <div className="doc-head">
        <p className="eyebrow">O orquestrador financeiro da construção</p>
        <h1>
          Conte quem é você<span className="dot">.</span>
        </h1>
        <p className="lede">
          Em menos de um minuto a gente estuda sua empresa e um assistente da Paggo conversa com você por voz, aqui
          mesmo no site.
        </p>
      </div>

      <form className="form" action={submitLead}>
        <Suspense>
          <FormError searchParams={searchParams as Promise<{ erro?: string }>} />
        </Suspense>
        <div className="field">
          <label htmlFor="name">Nome completo</label>
          <input id="name" name="name" autoComplete="name" required />
        </div>
        <div className="field">
          <label htmlFor="email">E-mail de trabalho</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="phone">Telefone</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" required />
        </div>
        <div className="field">
          <label htmlFor="role">Cargo</label>
          <select id="role" name="role" required defaultValue="">
            <option value="" disabled>
              Selecione
            </option>
            {Object.entries(ROLES).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="company">Empresa</label>
          <input id="company" name="company" autoComplete="organization" required />
        </div>
        <div className="field">
          <label htmlFor="extra">Quer contar mais?</label>
          <textarea id="extra" name="extra" rows={3} placeholder="Ex.: quantas empresas ou SPEs, tamanho do time financeiro" />
          <small>Opcional</small>
        </div>
        <div className="trap" aria-hidden="true">
          <label htmlFor="website">Não preencha este campo</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <label className="consent">
          <input type="checkbox" name="consent" required />
          <span>
            Concordo que a Paggo armazene e processe meus dados para este contato. A pesquisa usa dados públicos da empresa,
            e a conversa é com um assistente de IA.
          </span>
        </label>
        <button className="btn" type="submit">
          Enviar
        </button>
      </form>
    </main>
  );
}

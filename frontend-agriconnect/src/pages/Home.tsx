import React from 'react'

export default function Home() {
  return (
    <section className="space-y-8">
      <div className="rounded-[32px] bg-white p-10 shadow-[0_30px_70px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-700">Tableau de bord</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-950">Bienvenue sur AgriConnect</h1>
            <p className="mt-4 max-w-2xl text-slate-600">
              Pilotez vos opérations, suivez vos commandes et gardez le contact avec vos partenaires locaux.
            </p>
          </div>
          <div className="rounded-3xl bg-emerald-50 px-6 py-5 text-center text-emerald-900">
            <p className="text-sm uppercase tracking-[0.3em]">Performance</p>
            <p className="mt-3 text-3xl font-semibold">+23%</p>
            <p className="text-sm text-slate-600">de conversion cette semaine</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { title: 'Commandes en cours', value: '12', detail: 'Traitement et livraison' },
          { title: 'Nouveaux clients', value: '34', detail: 'En croissance rapide' },
          { title: 'Réserves disponibles', value: '289 t', detail: 'Stocks communs' },
        ].map(card => (
          <article
            key={card.title}
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">{card.title}</p>
            <p className="mt-5 text-4xl font-semibold text-slate-950">{card.value}</p>
            <p className="mt-3 text-sm text-slate-600">{card.detail}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

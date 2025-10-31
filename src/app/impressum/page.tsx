'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const lastUpdated = "31.10.2025";

export default function ImpressumPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <DashboardLayout
      userEmail={auth.currentUser?.email || undefined}
      onSignOut={handleSignOut}
    >
      <div className="w-full space-y-6">
        <h1 className="text-3xl font-semibold text-text-primary-light dark:text-text-primary-dark">
          Impressum &amp; Datenschutz
        </h1>

        {/* Impressum Card */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">Impressum</h2>

            <p className="text-base text-text-primary-light dark:text-text-primary-dark mb-3"><strong>Angaben gemäß § 5 TMG</strong></p>
            <address className="not-italic text-base text-text-primary-light dark:text-text-primary-dark mb-4">
              Eberhard Janzen<br />
              Rohrheimer Weg 43<br />
              71735 Eberdingen<br />
              Deutschland
            </address>

            <div className="text-base text-text-primary-light dark:text-text-primary-dark mb-4">
              <p className="mb-2"><strong>Kontakt:</strong></p>
              <p>Tel: <a href="tel:+491607029502" className="text-primary-light dark:text-primary-dark hover:underline">+49 160 7029502</a></p>
              <p>E-Mail: <a href="mailto:eberhard.janzen50@gmail.com" className="text-primary-light dark:text-primary-dark hover:underline">eberhard.janzen50@gmail.com</a></p>
            </div>

            <p className="text-base text-text-primary-light dark:text-text-primary-dark mb-4">
              <strong>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</strong><br />
              Eberhard Janzen, Anschrift wie oben
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">Haftung für Inhalte</h3>
            <p className="text-base text-text-primary-light dark:text-text-primary-dark">
              Als Diensteanbieter bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG bin ich als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden entsprechender Rechtsverletzungen werde ich diese Inhalte umgehend entfernen.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">Haftung für Links</h3>
            <p className="text-base text-text-primary-light dark:text-text-primary-dark">
              Mein Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte ich keinen Einfluss habe. Deshalb kann ich für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werde ich derartige Links umgehend entfernen.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">Urheberrecht</h3>
            <p className="text-base text-text-primary-light dark:text-text-primary-dark">
              Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitte ich um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werde ich derartige Inhalte umgehend entfernen.
            </p>
          </div>
        </div>

        {/* Datenschutz Card */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow p-6 space-y-6">
          <h2 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">Datenschutzerklärung</h2>

          <div>
            <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">1. Verantwortlicher</h3>
            <p className="text-base text-text-primary-light dark:text-text-primary-dark">
              Eberhard Janzen<br />
              Rohrheimer Weg 43<br />
              71735 Eberdingen<br />
              Deutschland<br />
              E-Mail: <a href="mailto:eberhard.janzen50@gmail.com" className="text-primary-light dark:text-primary-dark hover:underline">eberhard.janzen50@gmail.com</a>
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">2. Zwecke und Rechtsgrundlagen</h3>
            <p className="text-base text-text-primary-light dark:text-text-primary-dark">
              Beim Besuch dieser Website werden serverseitig technische Verbindungsdaten verarbeitet (z. B. IP-Adresse, Datum/Uhrzeit, aufgerufene URL, User-Agent), um die Website bereitzustellen und die IT-Sicherheit zu gewährleisten (Art. 6 Abs. 1 lit. f DSGVO). Wenn Sie mich per E-Mail oder Telefon kontaktieren, verarbeite ich Ihre Angaben zur Beantwortung der Anfrage (Art. 6 Abs. 1 lit. b oder f DSGVO).
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">3. Cookies, externe Dienste &amp; Einwilligungen</h3>
            <p className="text-base text-text-primary-light dark:text-text-primary-dark">
              Sofern Cookies, Analyse- oder Marketing-Dienste eingesetzt werden, geschieht dies nur nach Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Sie können Einwilligungen jederzeit mit Wirkung für die Zukunft widerrufen und Cookies in Ihrem Browser löschen oder blockieren.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">4. Speicherdauer</h3>
            <p className="text-base text-text-primary-light dark:text-text-primary-dark">
              Server-Logdaten werden aus Sicherheitsgründen in der Regel kurzzeitig gespeichert und anschließend gelöscht oder anonymisiert. Anfragen per E-Mail werden nach abschließender Bearbeitung gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">5. Empfänger</h3>
            <p className="text-base text-text-primary-light dark:text-text-primary-dark">
              Eine Weitergabe personenbezogener Daten erfolgt nur, sofern dies zur Vertragserfüllung erforderlich ist, eine rechtliche Verpflichtung besteht oder Sie eingewilligt haben.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">6. Ihre Rechte</h3>
            <p className="text-base text-text-primary-light dark:text-text-primary-dark">
              Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie das Recht auf Widerspruch gegen Verarbeitungen, die auf Art. 6 Abs. 1 lit. f DSGVO beruhen. Zudem besteht ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">7. Sicherheit</h3>
            <p className="text-base text-text-primary-light dark:text-text-primary-dark">
              Ich treffe technische und organisatorische Maßnahmen, um Ihre Daten gegen Verlust, Missbrauch und unbefugten Zugriff zu schützen und passe diese fortlaufend dem Stand der Technik an.
            </p>
          </div>

          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark italic mt-6">
            Stand: {lastUpdated}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

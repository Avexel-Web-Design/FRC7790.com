export default function InfoCards() {
  return (
    <section className="container mx-auto px-6 grid md:grid-cols-2 gap-6 max-w-4xl">
      <article className="bg-black/40 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-baywatch-orange mb-2">
          Understanding EPA and Power Ratings
        </h3>
        <p className="text-gray-300 text-sm leading-relaxed">
          EPA (Expected Points Added) is a predictive metric from Statbotics that estimates how many
          points a team contributes over an average qualification match. It is broken down into Auto,
          Teleop, and Endgame components. Use EPA to compare team strength beyond win‐loss records.
          Traditional metrics from The Blue Alliance—OPR (Offensive Power Rating), DPR (Defensive Power Rating),
          and CCWM (Calculated Contribution to Winning Margin)—are calculated from historical match data and
          offer complementary insights: OPR estimates a team's scoring output, DPR approximates the points it 
          allows, and CCWM reflects its net impact on the final margin.
        </p>
      </article>

      <article className="bg-black/40 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-baywatch-orange mb-2">Using this tool</h3>
        <ul className="list-disc list-inside text-gray-300 text-sm leading-relaxed space-y-1">
          <li>Enter an official event code or tap a suggestion to load teams.</li>
          <li>Sort by any EPA metric or team number.</li>
          <li>Toggle “Show Available Only” to hide already‐picked teams.</li>
          <li>Checkboxes let you mark draft picks; selections persist in your browser.</li>
          <li>Use “Clear All Picked” to reset your list.</li>
        </ul>
      </article>
    </section>
  );
}

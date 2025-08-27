// This page is intentionally not linked in navigation.
// Access directly via /privacy-policy
export default function PrivacyPolicy() {
  return (
    <div className="w-full bg-black text-gray-200 pt-24 pb-16 px-4 md:px-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-baywatch-orange bg-clip-text text-transparent">Privacy Policy</h1>
          <p className="mt-3 text-sm md:text-base text-gray-400">Last updated: 2025-08-26</p>
        </div>
        <div className="rounded-xl bg-gradient-to-b from-neutral-900/70 to-neutral-900/40 backdrop-blur border border-neutral-800 shadow-xl shadow-black/40 p-6 md:p-10 leading-relaxed text-sm md:text-[15px]">
          <p className="text-gray-300">This privacy policy applies to the FRC7790 app (hereby referred to as "Application") for mobile devices that was created by Avexel Web Design (hereby referred to as "Service Provider") as an Open Source service. This service is intended for use "AS IS".</p>

          <Section title="Information Collection and Use">
            <p>The Application collects information when you download and use it. This information may include information such as:</p>
            <FancyList>
              <li>Your device's Internet Protocol address (e.g. IP address)</li>
              <li>The pages of the Application that you visit, the time and date of your visit, the time spent on those pages</li>
              <li>The time spent on the Application</li>
              <li>The operating system you use on your mobile device</li>
            </FancyList>
            <p>The Application does not gather precise information about the location of your mobile device.</p>
            <p>The Application collects your device's location, which helps the Service Provider determine your approximate geographical location and make use of in below ways:</p>
            <FancyList>
              <li><strong>Geolocation Services:</strong> The Service Provider utilizes location data to provide features such as personalized content, relevant recommendations, and location-based services.</li>
              <li><strong>Analytics and Improvements:</strong> Aggregated and anonymized location data helps the Service Provider to analyze user behavior, identify trends, and improve the overall performance and functionality of the Application.</li>
              <li><strong>Third-Party Services:</strong> Periodically, the Service Provider may transmit anonymized location data to external services. These services assist them in enhancing the Application and optimizing their offerings.</li>
            </FancyList>
            <p>The Service Provider may use the information you provided to contact you from time to time to provide you with important information, required notices and marketing promotions.</p>
            <p>For a better experience, while using the Application, the Service Provider may require you to provide us with certain personally identifiable information, including but not limited to User ID, Username, Password hash, Push notification device token, Device platform, FRC Team favorites, Session/token identifiers, IP address, Browser user agent, User-generated content, Timestamps. The information that the Service Provider request will be retained by them and used as described in this privacy policy.</p>
          </Section>

          <Section title="Third Party Access">
            <p>Only aggregated, anonymized data is periodically transmitted to external services to aid the Service Provider in improving the Application and their service. The Service Provider may share your information with third parties in the ways that are described in this privacy statement.</p>
            <p>Please note that the Application utilizes third-party services that have their own Privacy Policy about handling data. Below are the links to the Privacy Policy of the third-party service providers used by the Application:</p>
            <FancyList>
              <li><a className="text-baywatch-orange hover:text-white underline decoration-dotted" href="https://www.google.com/policies/privacy/" target="_blank" rel="noopener noreferrer">Google Play Services</a></li>
            </FancyList>
            <p>The Service Provider may disclose User Provided and Automatically Collected Information:</p>
            <FancyList>
              <li>as required by law, such as to comply with a subpoena, or similar legal process;</li>
              <li>when they believe in good faith that disclosure is necessary to protect their rights, protect your safety or the safety of others, investigate fraud, or respond to a government request;</li>
              <li>with their trusted services providers who work on their behalf, do not have an independent use of the information we disclose to them, and have agreed to adhere to the rules set forth in this privacy statement.</li>
            </FancyList>
          </Section>

          <Section title="Opt-Out Rights">
            <p>You can stop all collection of information by the Application easily by uninstalling it. You may use the standard uninstall processes as may be available as part of your mobile device or via the mobile application marketplace or network.</p>
          </Section>

          <Section title="Data Retention Policy">
            <p>The Service Provider will retain User Provided data for as long as you use the Application and for a reasonable time thereafter. If you'd like them to delete User Provided Data that you have provided via the Application, please contact them at <a className="text-baywatch-orange hover:text-white underline decoration-dotted" href="mailto:contact@avexel.co">contact@avexel.co</a> and they will respond in a reasonable time.</p>
          </Section>

          <Section title="Children">
            <p>The Service Provider does not use the Application to knowingly solicit data from or market to children under the age of 13.</p>
            <p>The Application does not address anyone under the age of 13. The Service Provider does not knowingly collect personally identifiable information from children under 13 years of age. In the case the Service Provider discover that a child under 13 has provided personal information, the Service Provider will immediately delete this from their servers. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact the Service Provider (<a className="text-baywatch-orange hover:text-white underline decoration-dotted" href="mailto:contact@avexel.co">contact@avexel.co</a>) so that they will be able to take the necessary actions.</p>
          </Section>

          <Section title="Security">
            <p>The Service Provider is concerned about safeguarding the confidentiality of your information. The Service Provider provides physical, electronic, and procedural safeguards to protect information the Service Provider processes and maintains.</p>
          </Section>

          <Section title="Changes">
            <p>This Privacy Policy may be updated from time to time for any reason. The Service Provider will notify you of any changes to the Privacy Policy by updating this page with the new Privacy Policy. You are advised to consult this Privacy Policy regularly for any changes, as continued use is deemed approval of all changes.</p>
            <p>This privacy policy is effective as of 2025-08-26.</p>
          </Section>

          <Section title="Your Consent">
            <p>By using the Application, you are consenting to the processing of your information as set forth in this Privacy Policy now and as amended by us.</p>
          </Section>

          <Section title="Contact Us">
            <p>If you have any questions regarding privacy while using the Application, or have questions about the practices, please contact the Service Provider via email at <a className="text-baywatch-orange hover:text-white underline decoration-dotted" href="mailto:contact@avexel.co">contact@avexel.co</a>.</p>
          </Section>
          <div className="mt-10 pt-6 border-t border-neutral-800 text-xs text-gray-500">
            <p>This privacy policy page was generated by <a className="text-baywatch-orange hover:text-white underline decoration-dotted" href="https://app-privacy-policy-generator.nisrulz.com/" target="_blank" rel="noopener noreferrer">App Privacy Policy Generator</a>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponents for consistent styling
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-xl font-semibold mb-3 text-white tracking-tight relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-10 after:bg-baywatch-orange">{title}</h2>
      <div className="space-y-4 text-gray-300">{children}</div>
    </section>
  );
}

function FancyList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-4 space-y-2 [&>li]:pl-6 [&>li]:relative text-gray-300">
      {Array.isArray(children) ? children.map((li, i) => (
        <li key={i} className="before:content-[''] before:absolute before:left-1 before:top-2 before:w-2 before:h-2 before:rounded-full before:bg-baywatch-orange">{li}</li>
      )) : children}
    </ul>
  );
}

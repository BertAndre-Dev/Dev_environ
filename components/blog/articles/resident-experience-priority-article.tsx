import {
  BlogProse,
  BlogSectionHeading,
  BlogPullQuote,
  BlogHighlight,
} from "@/components/blog/blog-prose";
import BlogImage from "@/components/blog/blog-image";

export default function ResidentExperiencePriorityArticle() {
  return (
    <BlogProse>
      <p>
        Imagine two families moving into two different estates on the same day.
        Both estates have beautiful homes, paved roads, functioning
        streetlights, and security at the gate. At first glance, they seem
        identical. But six months later, the experiences of these families are
        completely different.
      </p>

      <p>
        In the first estate, communication is poor. Maintenance requests take
        too long to resolve, important updates are missed, and residents often
        feel disconnected from management. Visitors experience delays at the
        gate, and simple issues become sources of frustration.
      </p>

      <p>
        In the second estate, residents receive timely updates, service requests
        are handled efficiently, and communication is clear. Challenges still
        arise, but residents feel informed and confident that management is
        responsive.
      </p>

      <BlogPullQuote>
        The difference isn&apos;t the quality of the buildings. It&apos;s the
        quality of the resident experience.
      </BlogPullQuote>

      <BlogImage
        src="/assets/blog/blog-3.jpg"
        alt="Residents enjoying a well-managed residential estate community"
        caption="Residents judge an estate not by what happens behind the scenes, but by what they experience every day."
      />

      <BlogSectionHeading id="operations-vs-experience">
        Beyond Operations: What Residents Actually Experience
      </BlogSectionHeading>

      <p>
        For years, estate management has focused on operations—maintaining
        infrastructure, collecting service charges, coordinating security, and
        managing daily activities. While these responsibilities are essential,
        residents rarely judge an estate by what happens behind the scenes.
      </p>

      <p>Instead, they judge it by what they experience every day.</p>

      <p>
        They experience estate management when they report a maintenance issue,
        receive a community update, make a payment, or welcome a visitor into
        the estate. These everyday interactions shape how they feel about the
        community they call home.
      </p>

      <BlogSectionHeading id="task-vs-experience">
        Completing a Task Is Not the Same as Delivering an Experience
      </BlogSectionHeading>

      <p>
        Consider a resident who reports a plumbing issue. The problem is
        eventually fixed, but days pass without any communication from
        management. From an operational perspective, the task was completed.
        From the resident&apos;s perspective, however, the experience was
        frustrating because they were left uninformed throughout the process.
      </p>

      <BlogHighlight title="An important reality">
        <p>
          Completing a task is not the same as delivering a positive experience.
        </p>
      </BlogHighlight>

      <p>
        The most successful estates understand this. They recognize that
        residents value more than security and infrastructure. They value
        transparency, responsiveness, convenience, and clear communication.
      </p>

      <p>
        When residents feel informed and supported, trust grows. And when trust
        grows, communities become stronger.
      </p>

      <BlogSectionHeading id="technology-role">
        Why Technology Matters as Estates Grow
      </BlogSectionHeading>

      <p>
        As estates become larger and more complex, delivering this level of
        experience through manual processes becomes increasingly difficult.
        Information gets scattered across spreadsheets, phone calls, emails,
        and messaging platforms, making communication and service delivery
        harder to manage.
      </p>

      <p className="font-medium text-[#111827]">
        This is where technology plays a critical role.
      </p>

      <BlogSectionHeading id="bertahub">
        This Is Where Bertahub Comes In
      </BlogSectionHeading>

      <p>
        As an estate operating system built for modern communities, Bertahub
        helps property and facility managers streamline everyday operations
        through a centralized platform for payments, communication, visitor
        management, maintenance requests, and resident engagement. By reducing
        operational friction and improving visibility, Bertahub enables managers
        to focus less on administrative challenges and more on creating
        exceptional resident experiences.
      </p>

      <BlogSectionHeading id="conclusion">
        What Residents Remember
      </BlogSectionHeading>

      <p>
        Ultimately, residents may not remember how many reports were generated
        or how many administrative tasks were completed. What they remember is
        how living in the community made them feel.
      </p>

      <ul className="list-disc pl-6 space-y-2 text-[#374151]">
        <li>Did they feel informed?</li>
        <li>Did they feel heard?</li>
        <li>Did they feel supported?</li>
      </ul>

      <BlogHighlight>
        <p>
          The future of estate management is not just about maintaining
          properties. It is about creating communities where people feel
          connected, valued, and cared for.
        </p>
        <p className="mt-4 font-medium text-[#111827]">
          Because while infrastructure creates an estate, resident experience is
          what transforms it into a thriving community.
        </p>
      </BlogHighlight>
    </BlogProse>
  );
}

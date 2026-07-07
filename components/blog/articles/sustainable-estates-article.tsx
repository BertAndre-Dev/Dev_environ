import {
  BlogProse,
  BlogSectionHeading,
  BlogPullQuote,
  BlogHighlight,
} from "@/components/blog/blog-prose";
import BlogImage from "@/components/blog/blog-image";

export default function SustainableEstatesArticle() {
  return (
    <BlogProse>
      <p>
        Walk through any well-managed estate today and you&apos;ll notice the
        obvious things first: clean roads, working streetlights, trimmed lawns,
        and secure entrances.
      </p>

      <p>
        But sustainability goes beyond appearances. A truly sustainable estate
        uses its resources wisely, reduces waste, operates efficiently, and
        creates an environment where residents can thrive for years to come.
        While many people associate sustainability with green buildings or solar
        panels, meaningful change often starts with simple operational
        decisions.
      </p>

      <BlogPullQuote>
        Meaningful sustainability often starts with simple operational
        decisions — not massive investments.
      </BlogPullQuote>

      <BlogImage
        src="/assets/blog/blog-4b.jpeg"
        alt="Recycling bins, solar-powered street lighting, and green landscaping in a sustainable residential estate"
        caption="Sustainable estates balance efficient operations with environments where residents can thrive."
        aspectClassName="aspect-[9/16]"
        fit="contain"
        className="max-w-xs sm:max-w-sm mx-auto"
      />

      <BlogSectionHeading id="go-digital">
        1. Go Digital and Reduce Paper Waste
      </BlogSectionHeading>

      <p>
        Replace printed notices, paper receipts, and handwritten records with
        digital communication, online payments, and centralized record-keeping.
        This reduces waste while improving efficiency and transparency.
      </p>

      <BlogSectionHeading id="preventive-maintenance">
        2. Encourage Preventive Maintenance
      </BlogSectionHeading>

      <p>
        Routine inspections and scheduled maintenance help extend the lifespan of
        estate assets, reduce waste, and lower long-term costs.
      </p>

      <BlogSectionHeading id="conserve-water-energy">
        3. Help Residents Conserve Water and Energy
      </BlogSectionHeading>

      <p>
        Promptly fix leaks, encourage energy-efficient lighting, monitor
        utility usage, and educate residents about responsible consumption.
      </p>

      <BlogSectionHeading id="community-participation">
        4. Build a Community That Participates
      </BlogSectionHeading>

      <p>
        Organize clean-up initiatives, encourage recycling, share regular
        updates, and involve residents in creating a more sustainable
        community.
      </p>

      <BlogSectionHeading id="use-technology">
        5. Use Technology to Make Better Decisions
      </BlogSectionHeading>

      <p>
        Digital estate management platforms provide valuable insights into
        maintenance, payments, communication, and service delivery, helping
        managers make informed decisions.
      </p>

      <BlogSectionHeading id="conclusion">
        Sustainability Starts With Everyday Decisions
      </BlogSectionHeading>

      <p>
        Creating a sustainable estate doesn&apos;t require massive investments.
        It begins with practical, consistent actions.
      </p>

      <BlogHighlight>
        <p>
          At Bertahub, we believe smarter estate management creates stronger,
          more sustainable communities through technology, efficient operations,
          and resident engagement.
        </p>
      </BlogHighlight>
    </BlogProse>
  );
}

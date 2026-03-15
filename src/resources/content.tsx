import { About, Blog, Gallery, Home, Newsletter, Person, Social, Work } from "@/types";
import { Line, Row, Text, SmartLink , List, ListItem } from "@once-ui-system/core";

const person: Person = {
  firstName: "Jerry",
  lastName: "Qiu",
  name: `Jerry Qiu`,
  role: "Creator",
  avatar: "/images/avatar.jpg",
  email: "hello@jerryqiu.com",
  location: "America/New_York", // Expecting the IANA time zone identifier, e.g., 'Europe/Vienna'
  languages: ["English", "Mandarin Chinese","French"], // optional: Leave the array empty if you don't want to display languages
};

const newsletter: Newsletter = {
  display: false,
  title: <>Subscribe to {person.firstName}'s Newsletter</>,
  description: <>My weekly newsletter about creativity and engineering</>,
};

const social: Social = [
  // Links are automatically displayed.
  // Import new icons in /once-ui/icons.ts
  // Set essentials: true for links you want to show on the about page
  {
    name: "LinkedIn",
    icon: "linkedin",
    link: "https://www.linkedin.com/in/jqiu2026/",
    essential: true,
  },
  {
    name: "Instagram",
    icon: "instagram",
    link: "https://www.instagram.com/jqiu2026/",
    essential: true,
  },
  {
    name: "YouTube",
    icon: "youtube",
    link: "https://www.youtube.com/@jqiu2026",
    essential: true,
  },
  {
    name: "Email",
    icon: "email",
    link: `mailto:${person.email}`,
    essential: true,
  },
];

const home: Home = {
  path: "/",
  image: "/images/og/home.jpg",
  label: "Home",
  title: `${person.name}'s Portfolio`,
  description: `Discover my work as a ${person.role}`,
  headline: <>Your Vision = My Mission.</>,
  featured: {
    display: true,
    title: (
      <Row gap="12" vertical="center">
        <strong className="ml-4">Featured</strong>{" "}
        <Line background="brand-alpha-strong" vert height="20" />
        <Text marginRight="4" onBackground="brand-medium">
          Recent projects
        </Text>
      </Row>
    ),
    href: "/work",
  },
  subline: (
    <>
    I'm Jerry, a <Text as="span" size="xl" weight="strong">creator</Text> passionate about capturing moments that matter. <br /> I'm also an Aerospace Engineering major at [TBD].
</>
  ),
};

const about: About = {
  path: "/about",
  label: "About",
  title: `About – ${person.name}`,
  description: `Meet ${person.name}, ${person.role} from ${person.location}`,
  tableOfContent: {
    display: true,
    subItems: false,
  },
  avatar: {
    display: true,
  },
  calendar: {
    display: true,
    link: "mailto:bookings@jerryqiu.com",
  },
  intro: {
    display: true,
    title: "Introduction",
    description: (
      <>
        Jerry is a creator and photographer based in New York City. He approaches photography thoughtfully, aiming to capture moments that matter. He has contributed to several non-profits and his high school through his work.
      </>
    ),
  },
  work: {
    display: true, // set to false to hide this section
    title: "Work Experience",
    experiences: [
      {
        company: "Monroe YABC",
        timeframe: "Feb 2025 - Jun 2025",
        role: "Student Teaching Assistant",
        achievements: [
          <>
            Helped teach a <b>Drone Piloting</b> class. 
          </>,
        ],
        images: [
          // optional: leave the array empty if you don't want to display images
          
        ],
      },
    ],
  },
  studies: {
    display: true, // set to false to hide this section
    title: "Studies",
    institutions: [
      {
        name: "[Insert College]",
        description: <>Will be pursuing a B.S. in Aerospace Engineering.</>,
      },
      {
        name: "Stuyvesant High School",
        description: <>Expected to graduate in <b>June 2026</b> with a high school diploma and advanced regents designation.</>,
      },
    ],
  },
  technical: {
    display: true, // set to false to hide this section
    title: "Technical Skills",
    skills: [
      {
        title: "Adobe Creative Cloud",
        description: (
          <>Several years of experience using Lightroom and Lightroom Classic for photo editing, Premiere for video editing, and Photoshop for photo corrections and creative projects.</>
        ),
        tags: [
          {
            name: "Adobe",
            icon: "adobe",
          },
          {
            name: "Photoshop",
            icon: "photoshop",
          },
          {
            name: "Premiere",
            icon: "premiere",
          },
        ],
        // optional: leave the array empty if you don't want to display images
        images: [
          
        ],
      },
      {
        title: "Certified Drone Pilot",
        description: (
          <>Certified drone pilot with some experience in aerial photography and videography. Currently exploring FPV flying techniques to expand my skills.</>
        ),
        tags: [
          {
            name: "DJI",
            icon: "dji",
          },
          {
            name: "Part 107",
            icon: "drone",
          },
        ],
        // optional: leave the array empty if you don't want to display images
        images: [
          
        ],
      },
      {
        title: "Graphic Design",
        description: (
          <>Experienced in creating social media graphics and visual content using Figma and Canva, with a focus on clean, thoughtful aesthetics that communicate ideas effectively.</>
        ),
        tags: [
          {
            name: "Figma",
            icon: "figma",
          },
          {
            name: "Canva",
            icon: "canva",
          },
        ],
        // optional: leave the array empty if you don't want to display images
        images: [
          
        ],
      },
      {
        title: "Digital Content Management",
        description: (
          <>Experienced in managing social media accounts, creating engaging content and analyzing performance metrics to optimize reach and engagement.
          <br />
          <b>MANAGED ACCOUNTS:</b>
          <List>
            <ListItem><SmartLink href="https://instagram.com/stuyaviators" prefixIcon="instagram" selected>@stuyaviators</SmartLink> (April 2024 - Present)</ListItem>
            <ListItem><SmartLink href="https://instagram.com/stuycast" prefixIcon="instagram" selected>@stuycast</SmartLink> (September 2025 - Present)</ListItem>
            <ListItem><SmartLink href="https://instagram.com/wiki/@seniorsing26" prefixIcon="instagram" selected>@seniorsing26</SmartLink> (Jan 2026 - Mar 2026)</ListItem>
          </List>
          <br />
          Administrator for the <SmartLink href="https://roblox-shipping-lanes.fandom.com/wiki/Shipping_Lanes_Wiki" prefixIcon="link" selected>Roblox Shipping Lanes Wiki</SmartLink>, responsible for organizing, editing, and maintaining content. Ensures accuracy, clarity, and accessibility while fostering an engaged community of users.</>
        ),
        tags: [
          {
            name: "Instagram",
            icon: "instagram",
          },
          {
            name: "Fandom Wiki",
            icon: "fandom",
          },
        ],
        // optional: leave the array empty if you don't want to display images
        images: [
          
        ],
      },
      {
        title: "Coding & Programming",
        description: (
          <><List><ListItem>Python (3+ years)</ListItem>
          <ListItem>Lua / Luau (3+ years) — Roblox Studio</ListItem>
          <ListItem>Java (1+ years)</ListItem>
          <ListItem>Experienced with web technologies and GitHub</ListItem></List></>
        ),
        tags: [
          {
            name: "Python",
            icon: "python",
          },
          {
            name: "Java",
            icon: "java",
          },
          {
            name: "Lua",
            icon: "lua",
          },
          {
            name: "Roblox Studio",
            icon: "robloxstudio",
          },
          {
            name: "GitHub",
            icon: "github",
          },
          {
            name: "Web Dev",
            icon: "globe",
          },
        ],
        // optional: leave the array empty if you don't want to display images
        images: [
          
        ],
      },
    ],
  },
};

const blog: Blog = {
  path: "/blog",
  label: "Blog",
  title: `${person.firstName}'s Blog`,
  description: `Thoughts, stories, and insights from my creative journey.`,
  // Create new blog posts by adding a new .mdx file to app/blog/posts
  // All posts will be listed on the /blog route
};

const work: Work = {
  path: "/work",
  label: "Work",
  title: `${person.firstName}'s Projects`,
  description: `A collection of personal and commissioned photography and video projects.`,
  // Create new project pages by adding a new .mdx file to app/blog/posts
  // All projects will be listed on the /home and /work routes
};

const gallery: Gallery = {
  path: "/gallery",
  label: "Gallery",
  title: `${person.firstName}'s Portfolio`,
  description: `Curated samples of my photography work.`,
  images: [
    {
      src: "/images/gallery/horizontal-1.jpg",
      alt: "image",
      orientation: "horizontal",
    },
  ],
};

export { about, blog, gallery, home, newsletter, person, social, work };


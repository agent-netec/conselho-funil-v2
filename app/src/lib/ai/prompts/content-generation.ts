/**
 * Content Generation Prompts — 4 formatos especializados
 * Cada prompt produz output JSON validado por Zod schema correspondente em types/content.ts.
 *
 * @module lib/ai/prompts/content-generation
 * @story S33-GEN-02
 */

/** System instruction base — injetada em toda geracao com Brand Voice context */
export const CONTENT_SYSTEM_INSTRUCTION = `You are an expert content strategist and copywriter for social media.
You generate editorial content that is engaging, on-brand, and optimized for the target platform.

RULES:
- Always stay within the brand voice guidelines provided
- Generate content in the language most appropriate for the brand's audience
- Be creative but professional
- Output MUST be valid JSON matching the expected schema exactly
- Do NOT include markdown formatting in your JSON output values`;

/** Prompt: Post Feed (max 2200 chars) */
export const CONTENT_POST_PROMPT = `Generate a social media feed post for {platform}.

## Context
- Brand: {brandName}
- Topic: {topic}
- Tone: {tone}
- Keywords: {keywords}
- Target Audience: {targetAudience}

## Requirements
- Hook: Start with an attention-grabbing first line
- Body: Develop the topic with value for the audience (informative, entertaining, or inspiring)
- CTA: End with a clear call-to-action
- Maximum 2200 characters for the main text
- Suggest 5-15 relevant hashtags
- Suggest a visual concept for the post image/graphic

## Output Format (JSON)
{
  "text": "The complete post text (hook + body + CTA)",
  "hashtags": ["hashtag1", "hashtag2", "..."],
  "cta": "The specific call-to-action text",
  "visualSuggestion": "Description of the ideal visual to accompany this post"
}`;

/** Prompt: Story (max 150 chars, casual/urgent tone) */
export const CONTENT_STORY_PROMPT = `Generate an Instagram/social media Story for {platform}.

## Context
- Brand: {brandName}
- Topic: {topic}
- Tone: {tone}
- Keywords: {keywords}
- Target Audience: {targetAudience}

## Requirements
- Text must be SHORT (max 150 characters) — stories are visual-first
- Tone should be casual, urgent, or conversational
- Suggest a background style/color
- Suggest interactive elements (polls, questions, stickers)
- Include swipe-up CTA if applicable

## Output Format (JSON)
{
  "text": "Short story text (max 150 chars)",
  "backgroundSuggestion": "Background style description",
  "stickerSuggestions": ["poll: ...", "question: ...", "..."],
  "ctaSwipeUp": "Optional swipe-up CTA text"
}`;

/** Prompt: Carousel Outline (3-10 slides, progressive narrative) */
export const CONTENT_CAROUSEL_PROMPT = `Generate a carousel/slide deck outline for {platform}.

## Context
- Brand: {brandName}
- Topic: {topic}
- Tone: {tone}
- Keywords: {keywords}
- Target Audience: {targetAudience}

## Requirements
- Title: Compelling carousel title for the cover slide
- Slides: 3-10 slides with progressive narrative (each slide builds on the previous)
- Each slide has a title and body text
- First slide = hook/promise, middle slides = content/value, last slide = CTA
- Suggest a cover design concept
- Final CTA should drive engagement (save, share, follow)

## Output Format (JSON)
{
  "title": "Carousel title for cover slide",
  "slides": [
    { "title": "Slide 1 title", "body": "Slide 1 body text" },
    { "title": "Slide 2 title", "body": "Slide 2 body text" }
  ],
  "ctaFinal": "Final call-to-action text",
  "coverSuggestion": "Description of ideal cover slide design"
}`;

/** Prompt: Reel Script (15-60s, scene-by-scene) */
export const CONTENT_REEL_PROMPT = `Generate a Reel/short video script for {platform}.

## Context
- Brand: {brandName}
- Topic: {topic}
- Tone: {tone}
- Keywords: {keywords}
- Target Audience: {targetAudience}

## Requirements
- Hook: First 3 seconds must grab attention (this is critical for retention)
- Script: Scene-by-scene with timing for each scene
- Each scene includes: timing, spoken/visual script, text overlay suggestion
- Target duration: 15-60 seconds total
- Suggest trending audio/music style if applicable
- End with clear CTA

## Output Format (JSON)
{
  "hook": "Opening 3-second hook text/action",
  "scenes": [
    {
      "timing": "0-3s",
      "script": "What happens in this scene",
      "overlay": "Text overlay suggestion"
    }
  ],
  "musicReference": "Suggested music style or trend",
  "ctaFinal": "Final call-to-action"
}`;

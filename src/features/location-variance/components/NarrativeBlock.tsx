/**
 * NarrativeBlock
 *
 * Renders the backend's templated narrative as a bulleted list. Two passes:
 *
 *   1. Split the paragraph into sentences (top-level bullets).
 *   2. If a sentence contains a "Driven by..." SKU list (comma-separated
 *      "Name (-N plates = ₹-X)" clauses), split that into sub-bullets so
 *      each SKU sits on its own row. Big readability win when there are
 *      3+ SKUs in the list.
 */

import React from 'react';

interface NarrativeBlockProps {
	narrative: string;
}

const splitIntoSentences = (text: string): string[] => {
	if (!text) return [];
	// Split on ". " sentence boundary. Avoids splitting "₹1,234.56" or "21.86%"
	// because the period in those is not followed by whitespace + capital.
	return text
		.split(/(?<=[.!?])\s+(?=[A-Z\d—₹])/g)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
};

interface SentenceParts {
	lead: string;          // text before the SKU list
	items: string[];       // each SKU clause, one per array slot
	trail: string;         // text after the SKU list (rarely populated)
}

/**
 * If a sentence is shaped like `Driven by ...: A (...), B (...), C (...).`
 * return the parsed parts. Otherwise return null and the caller renders
 * the whole sentence as a single bullet.
 *
 * Detection: look for the colon followed by a comma-list of `Name (...)`
 * fragments. Each fragment ends at the last close-paren + optional comma.
 */
const extractSkuList = (sentence: string): SentenceParts | null => {
	const colonIdx = sentence.indexOf(': ');
	if (colonIdx === -1) return null;

	const lead = sentence.slice(0, colonIdx + 1); // include the colon
	const rest = sentence.slice(colonIdx + 2);    // skip ": "
	if (!rest) return null;

	// Strip trailing period for splitting; we'll add it back on the last item.
	const trailingPeriod = /[.!?]$/.test(rest);
	const body = trailingPeriod ? rest.slice(0, -1) : rest;

	// Split on `), ` to keep the parens intact in each clause.
	const fragments = body.split(/\),\s+/g).map((f, i, arr) => {
		// Add back the close paren we consumed in the split, except for the last
		// fragment which already has its close paren.
		return i < arr.length - 1 ? `${f})` : f;
	});

	// Only treat as a SKU list when we got 2+ fragments AND each looks like "Name (...)".
	if (fragments.length < 2) return null;
	const looksLikeSku = fragments.every((f) => /\(.+\)$/.test(f.trim()));
	if (!looksLikeSku) return null;

	return {
		lead,
		items: fragments.map((s) => s.trim()),
		trail: '',
	};
};

export const NarrativeBlock: React.FC<NarrativeBlockProps> = ({ narrative }) => {
	if (!narrative) return null;
	const sentences = splitIntoSentences(narrative);

	if (sentences.length === 0) {
		return null;
	}

	return (
		<div className='rounded-md border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-sm text-gray-800'>
			<ul className='space-y-1.5 list-disc list-outside pl-5'>
				{sentences.map((s, i) => {
					const parts = extractSkuList(s);
					if (!parts) {
						return <li key={i}>{s}</li>;
					}
					return (
						<li key={i}>
							{parts.lead}
							<ul className='space-y-0.5 list-[circle] list-outside pl-5 mt-1'>
								{parts.items.map((item, j) => (
									<li key={j} className='font-mono text-[12px]'>
										{item}
									</li>
								))}
							</ul>
						</li>
					);
				})}
			</ul>
		</div>
	);
};

const enDialogs = {
			textarea: {
				openFullscreen: 'Open fullscreen',
				title: 'Editing',
				tabs: {
					edit: 'Edit',
					preview: 'Preview',
				},
			},
			liquidDocs: {
				open: 'Open Liquid docs',
				searchPlaceholder: 'Search tokens, descriptions, and examples',
				noSearchResults: 'No Liquid docs entries match your search',
				sections: {
					usage: 'Usage',
					variables: 'Variables',
					methods: 'Methods',
					macros: 'Macros',
					examples: 'Examples',
				},
				contexts: {
					instruction: {
						title: 'Instruction Liquid docs',
						usage: 'Used when rendering chat instructions before generation.',
					},
					operationTemplate: {
						title: 'Template operation Liquid docs',
						usage: 'Used by operation kind=template for rendered effect payloads.',
					},
					operationLlm: {
						title: 'LLM operation Liquid docs',
						usage: 'Used by operation kind=llm for system and user prompt rendering.',
					},
					entityProfile: {
						title: 'Entity profile Liquid docs',
						usage: 'Liquid can be resolved in profile text fields directly and through multi-pass usage in other templates.',
					},
					worldInfoEntry: {
						title: 'World Info Liquid docs',
						usage: 'Used when rendering World Info entry content in runtime context.',
					},
					chatManualEdit: {
						title: 'Manual edit Liquid docs',
						usage: 'Used when chat message part is edited manually and rendered via Liquid.',
					},
				},
				variables: {
					char: 'Character object alias. Works as string and as object.',
					charName: 'Character name from current entity profile.',
					user: 'Selected user persona object alias.',
					userName: 'Selected user persona name.',
					chatId: 'Current chat identifier.',
					chatTitle: 'Current chat title.',
					messages: 'Prompt-visible history as array of { role, content }.',
					lastUserMessage: 'Last user message from messages array.',
					lastAssistantMessage:
						'Last assistant message from messages array. Before main LLM it is previous assistant reply, after main LLM it is freshly generated assistant reply.',
					now: 'Current ISO timestamp generated on server.',
					rag: 'Reserved retrieval context object.',
					description: 'Alias for char.description.',
					scenario: 'Alias for char.scenario.',
					personality: 'Alias for char.personality.',
					system: 'Alias for char.system_prompt.',
					persona: 'Alias for user persona description.',
					mesExamples: 'Alias for character example messages field.',
					mesExamplesRaw: 'Raw character example messages field before transforms.',
					anchorBefore: 'Alias for world info anchor before block.',
					anchorAfter: 'Alias for world info anchor after block.',
					wiBefore: 'World Info text inserted before history/system area.',
					wiAfter: 'World Info text inserted after history/system area.',
					loreBefore: 'Alias for World Info before block.',
					loreAfter: 'Alias for World Info after block.',
					outlet: 'Joined outlet map, key to rendered text.',
					outletEntries: 'Outlet map, key to array of raw rendered blocks.',
					anTop: 'Author note entries for top insertion.',
					anBottom: 'Author note entries for bottom insertion.',
					emTop: 'Extension memory entries for top insertion.',
					emBottom: 'Extension memory entries for bottom insertion.',
					promptSystem: 'Resolved system prompt visible in operation context.',
					art: 'Operation artifacts map by tag.',
					artValue: 'Artifact value by tag, for example art.note.value.',
				},
				methods: {
					recentMessages:
						'Returns the last N conversational messages with user/assistant roles in chronological order.',
					recentMessagesText:
						'Returns the last N conversational messages as text in `role: content` format separated by newlines.',
					recentMessagesByContextTokens:
						'Returns the last user/assistant messages until their approximate size reaches tokenLimit. Token counting is approximate and uses the current app heuristic `ceil(chars / 4)` while rounding upward on the last included message.',
					recentMessagesByContextTokensText:
						'Same as recentMessagesByContextTokens(tokenLimit), but formatted as newline-separated `role: content` text. Token counting is approximate and uses the current app heuristic `ceil(chars / 4)`.',
				},
				macros: {
					trim: 'Removes surrounding blank lines around macro location.',
					outlet: 'Shortcut to outlet map lookup by key.',
					random: 'Chooses one option at render time and inserts text.',
				},
				examples: {
					instructionSystem: {
						title: 'System template with world info',
					},
					instructionOutlet: {
						title: 'Outlet plus random tone',
					},
					operationTemplateArtifacts: {
						title: 'Read promptSystem and artifacts',
					},
					operationTemplatePromptTime: {
						title: 'Compose prompt-time payload',
					},
					operationLlmSystem: {
						title: 'LLM system template',
					},
					operationLlmPrompt: {
						title: 'LLM user prompt template',
					},
					entityProfileGreeting: {
						title: 'Greeting template',
					},
					entityProfileIndirect: {
						title: 'Indirect multi-pass profile usage',
					},
					worldInfoEntryCharacter: {
						title: 'World Info character-aware line',
					},
					worldInfoEntryOutlet: {
						title: 'World Info outlet merge',
					},
					chatManualEditRewrite: {
						title: 'Manual edit rewrite template',
					},
					chatManualEditHistory: {
						title: 'Manual edit history-aware template',
					},
					recentMessagesCount: {
						title: 'Recent message helpers by count',
					},
					recentMessagesTokens: {
						title: 'Recent message helpers by token budget',
					},
				},
			},
		};

export default enDialogs;


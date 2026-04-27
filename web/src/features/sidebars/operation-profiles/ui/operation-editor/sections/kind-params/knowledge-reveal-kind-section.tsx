import React from 'react';

import { KnowledgeKindFields } from './knowledge-kind-fields';

type Props = {
	index: number;
};

export const KnowledgeRevealKindSection: React.FC<Props> = ({ index }) => {
	return <KnowledgeKindFields index={index} kind="knowledge_reveal" />;
};

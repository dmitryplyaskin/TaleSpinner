import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { remarkQuotePlugin } from './remark-quote-plugin';
import { quotePlugin } from './quote-plugin';
import { Text } from '@chakra-ui/react';

type RenderMdProps = {
	content: string;
};

export const RenderMd = ({ content }: RenderMdProps) => {
	return (
		<Markdown
			remarkPlugins={[remarkGfm, quotePlugin]}
			rehypePlugins={[rehypeRaw]}
			components={{
				em(props) {
					const { node, ...rest } = props;
					return <i style={{ color: 'red' }} {...rest} />;
				},
				q: QuoteComponent,
				p: (props) => {
					const { node, ...rest } = props;
					return <Text my={2} {...rest} />;
				},
			}}
			// components={{ Quote: () =>  QuoteComponent }}
		>
			{content}
		</Markdown>
	);
};

const QuoteComponent: React.FC = (props) => {
	const { node, ...rest } = props;
	return <Text as="q" color={'orange.500'} _before={{ content: 'none' }} _after={{ content: 'none' }} {...rest} />;
};

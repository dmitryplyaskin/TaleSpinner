import { AgentCard, InteractionMessage } from '@shared/types/agent-card';
import * as creationHelper from '@utils/creation-helper-agent-card';
import { produce } from 'immer';

const addNewUserMessage = (agentCard: AgentCard | null, message: InteractionMessage) =>
	produce(agentCard, (draft) => {
		if (!draft) return;
		const branchId = draft.activeBranch?.branch.id ?? draft.interactionBranches[0]?.id;

		if (!branchId) return;

		const branch = draft.interactionBranches.find((branch) => branch.id === branchId) || draft.interactionBranches[0];

		if (!branch) return;

		branch.messages.push(message);
	});

const addNewAssistantMessage = (agentCard: AgentCard | null, message: InteractionMessage) =>
	produce(agentCard, (draft) => {
		if (!draft) return;
		const branchId = draft.activeBranch?.branch.id ?? draft.interactionBranches[0]?.id;

		if (!branchId) return;

		const branch = draft.interactionBranches.find((branch) => branch.id === branchId) || draft.interactionBranches[0];

		if (!branch) return;

		branch.messages.push(message);
	});

const updateSwipeStream = (
	agentCard: AgentCard | null,
	params: {
		messageId: string;
		swipeId: string;
		componentId: string;
		content: string;
	},
) =>
	produce(agentCard, (draft) => {
		if (!draft) return;
		const { messageId, swipeId, componentId, content } = params;

		const branch = draft.interactionBranches.find((branch) =>
			branch.messages.some((message) => message.id === messageId),
		);
		if (!branch) return;

		const message = branch.messages.find((message) => message.id === messageId);
		if (!message) return;

		const swipe = message.swipes.find((swipe) => swipe.id === swipeId);
		if (!swipe) return;

		const component = swipe.components.find((component) => component.id === componentId);
		if (!component) return;

		component.content += content;
	});

const createNewSwipe = (
	agentCard: AgentCard | null,
	params: {
		messageId: string;
		swipeId: string;
		componentId: string;
		content: string;
	},
) =>
	produce(agentCard, (draft) => {
		if (!draft) return;
		const { messageId, swipeId, componentId, content } = params;

		const branch = draft.interactionBranches.find((branch) =>
			branch.messages.some((message) => message.id === messageId),
		);
		if (!branch) return;

		const message = branch.messages.find((message) => message.id === messageId);
		if (!message) return;

		const swipe = message.swipes.find((swipe) => swipe.id === swipeId);
		if (!swipe) return;

		swipe.components.push({
			id: componentId,
			type: 'answer',
			content: content,
		});
	});

const updateSwipe = (
	agentCard: AgentCard | null,
	params: {
		messageId: string;
		swipeId: string;
		componentId: string;
		content: string;
	},
) =>
	produce(agentCard, (draft) => {
		if (!draft) return;
		const { messageId, swipeId, componentId, content } = params;

		const branch = draft.interactionBranches.find((branch) =>
			branch.messages.some((message) => message.id === messageId),
		);
		if (!branch) return;

		const message = branch.messages.find((message) => message.id === messageId);
		if (!message) return;

		const swipe = message.swipes.find((swipe) => swipe.id === swipeId);
		if (!swipe) return;

		const component = swipe.components.find((component) => component.id === componentId);
		if (!component) return;

		component.content = content;
	});

const deleteMessage = (agentCard: AgentCard | null, messageId: string) =>
	produce(agentCard, (draft) => {
		if (!draft) return;
		const branch = draft.interactionBranches.find((branch) =>
			branch.messages.some((message) => message.id === messageId),
		);
		if (!branch) return;

		branch.messages = branch.messages.filter((message) => message.id !== messageId);
	});

const deleteSwipe = (agentCard: AgentCard | null, params: { messageId: string; swipeId: string }) =>
	produce(agentCard, (draft) => {
		if (!draft) return;
		const { messageId, swipeId } = params;
		const branch = draft.interactionBranches.find((branch) =>
			branch.messages.some((message) => message.id === messageId),
		);

		if (!branch) return;

		const message = branch.messages.find((message) => message.id === messageId);
		if (!message) return;

		message.swipes = message.swipes.filter((swipe) => swipe.id !== swipeId);
	});

const addNewSwipe = (agentCard: AgentCard | null) =>
	produce(agentCard, (draft) => {
		if (!draft) return;

		const branch = draft.interactionBranches.find((branch) => branch.id === draft.activeBranchId);
		if (!branch) return;

		const message = branch.messages[branch.messages.length - 1];
		if (!message) return;

		const newSwipe = creationHelper.createNewSwipe({ content: '' });

		message.swipes.push(newSwipe.swipe);
		message.activeSwipeId = newSwipe.swipeId;
	});

const changeSwipe = (agentCard: AgentCard | null, direction: 'left' | 'right') =>
	produce(agentCard, (draft) => {
		if (!draft) return;

		const branch = draft.interactionBranches.find((branch) => branch.id === draft.activeBranchId);
		if (!branch) return;

		const message = branch.messages[branch.messages.length - 1];
		if (!message) return;

		const swipeIndex = message.swipes.findIndex((swipe) => swipe.id === message.activeSwipeId);
		if (swipeIndex === -1) return;

		if (direction === 'left') {
			message.activeSwipeId = message.swipes[swipeIndex - 1].id;
		} else {
			message.activeSwipeId = message.swipes[swipeIndex + 1].id;
		}
	});

const updater = (agentCard: AgentCard | null) =>
	produce(agentCard, (draft) => {
		if (!draft) return;

		const branch = draft.interactionBranches.find((branch) => branch.id === draft.activeBranchId);
		if (!branch) return;

		if (branch.messages.length > 1 || (branch.messages.length === 1 && !branch.messages[0].isIntro)) {
			branch.isStarted = true;
		}

		branch.messages.forEach((message) => {
			if (message.isLast) {
				message.isLast = false;
			}
		});
		const lastMessage = branch.messages[branch.messages.length - 1];
		lastMessage.isLast = true;
	});

export const reducers = {
	addNewUserMessage,
	addNewAssistantMessage,
	updateSwipeStream,
	createNewSwipe,
	updateSwipe,
	deleteMessage,
	deleteSwipe,
	addNewSwipe,
	changeSwipe,
	updater,
};

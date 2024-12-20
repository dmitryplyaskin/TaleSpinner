import { createEffect, createEvent, createStore } from "effector";
import { BASE_URL } from "../const";
import { ChatInfo } from "../types/chat";
import { v4 as uuidv4 } from "uuid";

export const $chatList = createStore<ChatInfo[]>([]);
export const $currentChatId = createStore("");

export const getChatListFx = createEffect<void, ChatInfo[]>(async () => {
  try {
    const response = await fetch(`${BASE_URL}/chats`).then((response) =>
      response.json()
    );

    return response;
  } catch (error) {
    console.error("Error fetching chat list:", error);
    return [];
  }
});

export const editChatFx = createEffect(async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/chats/${data.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return response.json();
  } catch (error) {
    console.error("Error editing chat:", error);
    return null;
  }
});

export const deleteChatFx = createEffect(async (data) => {
  if (!window.confirm("Вы уверены, что хотите удалить этот чат?")) {
    return;
  }
  try {
    const response = await fetch(`${BASE_URL}/chats/${data.id}`, {
      method: "DELETE",
    });
    return response.json();
  } catch (error) {
    console.error("Error deleting chat:", error);
    return null;
  }
});

export const createChatFx = createEffect(async () => {
  const newChatId = uuidv4();
  const newChat = {
    id: newChatId,
    title: "Новый чат",
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(`${BASE_URL}/chats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newChat),
    });
    return response.json();
  } catch (error) {
    console.error("Error creating chat:", error);
    return null;
  }
});

export const saveChatFx = createEffect(async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/chats/${data.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return response.json();
  } catch (error) {
    console.error("Error saving chat:", error);
    return null;
  }
});

$chatList
  .on(getChatListFx.doneData, (_, data) => data)
  .on(editChatFx.doneData, (state, data) => {
    console.log({ data });
    return state.map((chat) => {
      if (chat.id === data.id) {
        return { ...chat, ...data };
      }
      return chat;
    });
  })
  .on(deleteChatFx.done, (state, { params }) =>
    state.filter((chat) => chat.id !== params.id)
  )
  .on(createChatFx.doneData, (state, data) => [
    {
      id: data.id,
      title: data.title,
      timestamp: new Date().toISOString(),
    },
    ...state,
  ])
  .on(saveChatFx.doneData, (state, data) =>
    state.map((chat) => {
      if (chat.id === data.id) {
        return { ...chat, ...data };
      }
      return chat;
    })
  );

export const selectCurrentChat = createEvent<string>();

$currentChatId.on(selectCurrentChat, (_, data) => data);


export const $openEditor = createStore(false);
export const toggleEditor = createEvent();
$openEditor.on(toggleEditor, (state) => !state);
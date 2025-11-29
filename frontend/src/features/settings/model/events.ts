/**
 * Settings Feature - События
 */

import { createEvent } from 'effector';

/** Открыть панель настроек */
export const openSettings = createEvent();

/** Закрыть панель настроек */
export const closeSettings = createEvent();

/** Сбросить настройки к значениям по умолчанию */
export const resetSettings = createEvent();








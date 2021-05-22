import { createContext } from 'react';
import { PicoStore } from '../../core';

export const InternalPicoContext = createContext<PicoStore>(new PicoStore());

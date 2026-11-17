"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "./index";
import { hydrateAuth } from "./slices/auth.slice";

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  // One store per browser tab, created once
  const [store] = useState(makeStore);

  useEffect(() => {
    store.dispatch(hydrateAuth());
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}

"use client";

import { useReducer, useCallback } from "react";
import { ZoomState, ZoomLevel } from "@/lib/types";

type ZoomAction =
  | { type: "ZOOM_TO_MONTH"; month: number }
  | { type: "ZOOM_TO_DAY"; date: string }
  | { type: "ZOOM_OUT" };

function zoomReducer(state: ZoomState, action: ZoomAction): ZoomState {
  switch (action.type) {
    case "ZOOM_TO_MONTH":
      return { level: "month", selectedMonth: action.month, selectedDay: null };
    case "ZOOM_TO_DAY":
      return { ...state, level: "day", selectedDay: action.date };
    case "ZOOM_OUT":
      if (state.level === "day") return { ...state, level: "month", selectedDay: null };
      if (state.level === "month") return { level: "year", selectedMonth: null, selectedDay: null };
      return state;
    default:
      return state;
  }
}

const initialState: ZoomState = {
  level: "year",
  selectedMonth: null,
  selectedDay: null,
};

export function useZoom() {
  const [state, dispatch] = useReducer(zoomReducer, initialState);

  const zoomToMonth = useCallback((month: number) => {
    dispatch({ type: "ZOOM_TO_MONTH", month });
  }, []);

  const zoomToDay = useCallback((date: string) => {
    dispatch({ type: "ZOOM_TO_DAY", date });
  }, []);

  const zoomOut = useCallback(() => {
    dispatch({ type: "ZOOM_OUT" });
  }, []);

  return { state, zoomToMonth, zoomToDay, zoomOut };
}

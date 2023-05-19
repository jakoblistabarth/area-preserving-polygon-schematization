import { Snapshot } from "@/src/DCEL/Dcel";
import { FC } from "react";
import useAppStore from "../helpers/store";
import clsx from "clsx";
import * as Tooltip from "@radix-ui/react-tooltip";

type Props = {
  snapshots: Snapshot[];
};

const StepMap: FC<Props> = ({ snapshots }) => {
  const { setActiveSnapshot, activeSnapshot } = useAppStore();
  const width = 10;
  const height = 25;
  const gap = 2;
  return (
    <svg
      width={snapshots.length * width + (snapshots.length - 1) * gap + 2}
      height={height + 2}
    >
      {snapshots.map((d, i) => {
        const isActive = activeSnapshot?.id === d.id;
        return (
          <Tooltip.Provider key={d.id}>
            <Tooltip.Root open={isActive}>
              <Tooltip.Trigger asChild>
                <rect
                  x={width * i + gap * i + 1}
                  y={1}
                  rx={2}
                  width={width}
                  height={height}
                  className={clsx(
                    "cursor-pointer fill-blue-300 stroke-transparent stroke-1 transition-colors hover:stroke-blue-600",
                    isActive && "fill-blue-400 stroke-blue-900 !stroke-2"
                  )}
                  onClick={() => setActiveSnapshot(d.id)}
                />
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade text-violet11 z-above-map select-none rounded-[4px] bg-white px-[15px] py-[10px] text-[15px] leading-none shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] will-change-[transform,opacity]"
                  sideOffset={10}
                >
                  <strong>{d.step}</strong>
                  <p>
                    {i + 1}/{snapshots.length}
                  </p>
                  <Tooltip.Arrow className="fill-white" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        );
      })}
    </svg>
  );
};

export default StepMap;

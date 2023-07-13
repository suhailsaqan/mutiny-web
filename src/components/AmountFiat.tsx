import { Show } from "solid-js";
import { useMegaStore } from "~/state/megaStore";
import { satsToUsd } from "~/utils/conversions";
import bolt from "~/assets/icons/bolt.svg";
import chain from "~/assets/icons/chain.svg";

function prettyPrintAmount(n?: number | bigint): string {
    if (!n || n.valueOf() === 0) {
        return "0";
    }
    return n.toLocaleString();
}

export function AmountFiat(props: {
    amountSats: bigint | number | undefined;
    loading?: boolean;
    icon?: "lightning" | "chain" | "plus" | "minus";
}) {
    const [state, _] = useMegaStore();

    const amountInUsd = () =>
        satsToUsd(state.price, Number(props.amountSats) || 0, true);

    return (
        <div
            class="flex flex-col gap-1"
            classList={{
                "items-start": props.align === "left",
                "items-center": props.align === "center",
                "items-end": props.align === "right"
            }}
        >
            <Show when={props.showFiat}>
                <h2
                    class="font-light text-white/70"
                    classList={{
                        "text-black": props.whiteBg,
                        "text-white/70": !props.whiteBg,
                        "text-sm": !props.size,
                        "text-xs": props.size === "small",
                        "text-base": props.size === "large",
                        "text-lg": props.size === "xl"
                    }}
                >
                    ~
                    <Show when={props.size === "xl"}>
                        <span>&nbsp;</span>
                    </Show>
                    {props.loading ? "..." : amountInUsd()}
                    <Show when={props.size !== "small"}>
                        <span>&nbsp;</span>
                    </Show>
                    <span
                        class="text-sm"
                        classList={{
                            "text-xs": props.size === "small",
                            "text-base": props.size === "large"
                        }}
                    >
                        USD
                    </span>
                </h2>
            </Show>
        </div>
    );
}

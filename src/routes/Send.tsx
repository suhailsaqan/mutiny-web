import { RadioGroup, TextField } from "@kobalte/core";
import { For, Show, createResource, createSignal, onMount } from "solid-js";
import { Amount } from "~/components/Amount";
import NavBar from "~/components/NavBar";
import { Button, ButtonLink, DefaultMain, FancyCard, InnerCard, LargeHeader, SafeArea, SmallHeader } from "~/components/layout";
import { Paste } from "~/assets/svg/Paste";
import { Scan } from "~/assets/svg/Scan";
import { useMegaStore } from "~/state/megaStore";
import { MutinyInvoice, NodeManager } from "@mutinywallet/node-manager";
import { bip21decode } from "~/utils/TEMPbip21";
import { AmountEditable } from "~/components/AmountEditable";
import { useLocation } from "solid-start";
import { StyledRadioGroup } from "~/components/layout/Radio";

type SendSource = "lightning" | "onchain";

const PAYMENT_METHODS = [{ value: "lightning", label: "Lightning", caption: "Fast and cool" }, { value: "onchain", label: "On-chain", caption: "Just like Satoshi did it" }]

export default function Send() {
    const [state, _] = useMegaStore();

    // These can only be set by the user
    const [destination, setDestination] = createSignal("");
    const [privateLabel, setPrivateLabel] = createSignal("");

    // These can be derived from the "destination" signal or set by the user
    const [amountSats, setAmountSats] = createSignal(0n);
    const [source, setSource] = createSignal<SendSource>("lightning");

    // These can only be derived from the "destination" signal
    const [invoice, setInvoice] = createSignal<MutinyInvoice>();
    const [address, setAddress] = createSignal<string>();
    const [description, setDescription] = createSignal<string>();

    function clearAll() {
        setDestination("");
        setPrivateLabel("");
        setAmountSats(0n);
        setSource("lightning");
        setInvoice(undefined);
        setAddress(undefined);
        setDescription(undefined);
    }

    // If we were routed to by the scanner we can get the state from there
    const location = useLocation();

    onMount(() => {
        // TODO: probably a cleaner way to make typescript happy
        const routerInfo = location as { state?: { destination?: string } };
        if (routerInfo.state?.destination && typeof routerInfo.state.destination === "string") {
            setDestination(routerInfo.state.destination);
        }
    })

    // TODO: this is pretty temp until we have WAILA
    async function decode(source: string) {
        if (!source) return;
        try {
            const { address, label, lightning, amount } = bip21decode(source);

            setAddress(address)

            if (lightning) {
                const invoice = await state.node_manager?.decode_invoice(lightning);
                if (invoice?.amount_sats) setAmountSats(invoice.amount_sats);
                setInvoice(invoice)
                // We can stick with default lightning because there's an invoice
                setSource("lightning")
            } else {
                // If we can't use the lightning amount we have to use the float btc amount
                const amt = NodeManager.convert_btc_to_sats(amount || 0);
                setAmountSats(amt);

                // We use onchain because there's no invoice
                setSource("onchain")
            }

            if (label) setDescription(label);

            setInvoice(invoice)

            return invoice

        } catch (e) {
            console.error("error", e)
            clearAll();
        }
    }

    // IMPORTANT: pass the signal but don't "call" the signal (`destination`, not `destination()`)
    const [_decodedDestination] = createResource(destination, decode);

    let labelInput!: HTMLInputElement;

    function handlePaste() {
        navigator.clipboard.readText().then(text => {
            setDestination(text);
            labelInput.focus();
        });
    }

    async function handleSend() {
        const bolt11 = invoice()?.bolt11;
        if (source() === "lightning" && invoice() && bolt11) {
            const nodes = await state.node_manager?.list_nodes();
            const firstNode = nodes[0] as string || ""
            // If the invoice has sats use that, otherwise we pass the user-defined amount
            if (invoice()?.amount_sats) {
                await state.node_manager?.pay_invoice(firstNode, bolt11);
            } else {
                await state.node_manager?.pay_invoice(firstNode, bolt11, amountSats());

            }
        } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const txid = await state.node_manager?.send_to_address(address()!, amountSats());
            console.error(txid)
        }
        console.error("SENT");
    }

    return (
        <SafeArea>
            <DefaultMain>
                <LargeHeader>Send Bitcoin</LargeHeader>

                <dl>
                    <dt>
                        <SmallHeader>Destination</SmallHeader>
                    </dt>
                    <dd>
                        <Show when={destination()} fallback={<div class="flex flex-row gap-4">
                            <Button onClick={handlePaste}>
                                <div class="flex flex-col gap-2 items-center">
                                    <Paste />
                                    <span>Paste</span>
                                </div>
                            </Button>
                            <ButtonLink href="/scanner">
                                <div class="flex flex-col gap-2 items-center">
                                    <Scan />
                                    <span>Scan QR</span>
                                </div>
                            </ButtonLink>
                        </div>}>
                            <div class="flex gap-2 items-center">
                                <Show when={address() && source() === "onchain"}>
                                    <code class="truncate text-sm break-all">{"Address: "} {address()}
                                        <Show when={description()}>
                                            <br />
                                            {"Description:"} {description()}
                                        </Show>
                                    </code>
                                </Show>
                                <Show when={invoice() && source() === "lightning"}>
                                    <code class="truncate text-sm break-all">{"Invoice: "} {invoice()?.bolt11}
                                        <Show when={description()}>
                                            <br />
                                            {"Description:"} {description()}
                                        </Show>
                                    </code>
                                </Show>
                                <Button class="flex-0" intent="glowy" layout="xs" onClick={clearAll}>Clear</Button>
                            </div>
                            <div class="my-4">
                                {/* if the amount came with the invoice we can't allow setting it */}
                                <Show when={!(invoice()?.amount_sats)} fallback={<Amount amountSats={amountSats() || 0} showFiat />}>
                                    <AmountEditable amountSats={amountSats().toString() || "0"} setAmountSats={setAmountSats} />
                                </Show>
                            </div>
                        </Show>
                    </dd>

                    <Show when={address() && invoice()}>
                        <dt>
                            <SmallHeader>
                                Payment Method
                            </SmallHeader>
                        </dt>
                        <dd>
                            <StyledRadioGroup value={source()} onValueChange={setSource} choices={PAYMENT_METHODS} />
                        </dd>
                    </Show>
                    <Show when={destination()}>
                        <TextField.Root
                            value={privateLabel()}
                            onValueChange={setPrivateLabel}
                            class="flex flex-col gap-2"
                        >
                            <dt>
                                <SmallHeader>
                                    <TextField.Label>Label (private)</TextField.Label>
                                </SmallHeader>
                            </dt>
                            <dd>
                                <TextField.Input
                                    autofocus
                                    ref={el => labelInput = el}
                                    class="w-full p-2 rounded-lg bg-white/10"
                                    placeholder="A helpful reminder of why you spent bitcoin"
                                />
                            </dd>
                        </TextField.Root>
                    </Show>
                </dl>
                <Button disabled={!destination()} intent="blue" onClick={handleSend}>Confirm Send</Button>
            </DefaultMain>
            <NavBar activeTab="send" />
        </SafeArea >
    )
}
import { Dialog } from "@kobalte/core";
import { ParentComponent, createSignal } from "solid-js";
import { DIALOG_CONTENT, DIALOG_POSITIONER, OVERLAY } from "./DetailsModal";
import { ModalCloseButton, SmallHeader } from "./layout";
import { ExternalLink } from "./layout/ExternalLink";
import { useI18n } from "~/i18n/context";

export function FeesModal() {
    const i18n = useI18n();
    return (
        <MoreInfoModal title={i18n.t("whats_with_the_fees")} linkText={i18n.t("why?")}>
            <p>
                {i18n.t("more_info_modal_p1")}
            </p>
            <p>
                {i18n.t("more_info_modal_p2")}
            </p>
            <p>
                <ExternalLink href="https://github.com/MutinyWallet/mutiny-web/wiki/Understanding-liquidity">
                    {i18n.t("learn_more_about_liquidity")}
                </ExternalLink>
            </p>
        </MoreInfoModal>
    );
}

export const MoreInfoModal: ParentComponent<{
    linkText: string;
    title: string;
}> = (props) => {
    const [open, setOpen] = createSignal(false);

    return (
        <Dialog.Root open={open()} onOpenChange={setOpen}>
            <Dialog.Trigger>
                <button class="underline decoration-light-text hover:decoration-white font-semibold">
                    {props.linkText}
                </button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay class={OVERLAY} />
                <div class={DIALOG_POSITIONER}>
                    <Dialog.Content class={DIALOG_CONTENT}>
                        <Dialog.Title class="flex justify-between mb-2 items-center">
                            <SmallHeader>{props.title}</SmallHeader>
                            <Dialog.CloseButton>
                                <ModalCloseButton />
                            </Dialog.CloseButton>
                        </Dialog.Title>
                        <Dialog.Description class="flex flex-col gap-4">
                            <div>{props.children}</div>
                        </Dialog.Description>
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

import Builtin from "@structs/builtin";
import { CircleDollarSignIcon, CircleHelpIcon, PlugIcon, GithubIcon, GlobeIcon, HeartHandshakeIcon, PaletteIcon, PencilIcon, SettingsIcon, ShieldAlertIcon, Trash2Icon } from "lucide-react";

import { t } from "@common/i18n";
import SettingsStore, { type SettingsCollection } from "@stores/settings";
import ipc from "@modules/ipc";
import ContextMenuPatcher from "@api/contextmenu";
import pluginManager, { type Plugin } from "@modules/pluginmanager";
import themeManager from "@modules/thememanager";
import React from "@modules/react";
import DOMManager from "@modules/dommanager";
import Modals from "@ui/modals";
import { findInTree } from "@common/utils";
import { CustomCSS } from "@builtins/builtins";
import type AddonManager from "@modules/addonmanager";
import settings from "@ui/settings";
import { confirmEnable, confirmDelete } from "@ui/settings/addonlist";

// TODO: fix type after reworking the context module
const ContextMenu = new ContextMenuPatcher() as InstanceType<typeof ContextMenuPatcher> & {
	Separator: any;
	CheckboxItem: any;
	RadioItem: any;
	ControlItem: any;
	Group: any;
	Item: any;
	Menu: any;
};

export default new (class BDContextMenu extends Builtin {
	get name() {
		return "BDContextMenu";
	}
	get category() {
		return "general";
	}
	get id() {
		return "bdContextMenu";
	}

	patch?(): void;

	constructor() {
		super();
		this.callback = this.callback.bind(this);
	}

	async enabled() {
		this.patch = ContextMenu.patch("user-settings-cog", this.callback);
	}

	async disabled() {
		this.patch?.();
	}

	callback(retVal: any) {
		const target = findInTree(retVal, b => Array.isArray(b) && b.some(e => e?.key?.toLowerCase() === "my_account"), { walkable: ["props", "children"] });
		if (!target) return;

		// Prevent conflict with plugin until its eradicated
		if (target.some((e: any) => e.props.label.toLowerCase() === "betterdiscord")) return;

		// BetterDiscord Settings
		// TODO: de-dup when converting context menu module
		const items: Array<{ type?: string; label: any; action: () => Promise<void>; items?: any }> = SettingsStore.collections.map(c => this.buildCollectionMenu(c));

		// Updater
		items.push({
			label: t("Panels.updates"),
			action: () => this.openCategory("updates")
		});

		// Custom CSS
		if (SettingsStore.get("settings", "customcss", "customcss")) {
			items.push({
				label: t("Panels.customcss"),
				action: async () => CustomCSS.open()
			});
		}

		// Plugins & Themes
		items.push(this.buildAddonMenu("plugin", t("Panels.plugins"), pluginManager));
		items.push(this.buildAddonMenu("theme", t("Panels.themes"), themeManager));

		// Parent SubMenu
		const bdSubMenu = ContextMenu.buildItem({ type: "submenu", label: "BetterDiscord", items: items });
		const bdGroup = React.createElement(ContextMenu.Group, null, [bdSubMenu]);
		target.push(bdGroup);
	}

	buildCollectionMenu(collection: SettingsCollection) {
		return {
			type: "submenu",
			label: collection.name,
			action: () => this.openCategory(collection.id),
			items: collection.settings.map(category => {
				return {
					type: "submenu",
					label: category.name,
					action: () => this.openCategory(collection.id),
					items: category.settings
						.filter(s => s.type === "switch" && !s.hidden && s.id !== this.id)
						.map(setting => {
							return {
								type: "toggle",
								label: setting.name,
								disabled: setting.disabled,
								active: SettingsStore.get(collection.id, category.id, setting.id),
								action: () => SettingsStore.set(collection.id, category.id, setting.id, !SettingsStore.get(collection.id, category.id, setting.id))
							};
						})
				};
			})
		};
	}

	/**
	 * TODO: Can this be done better now that it's integrated?
	 * @param {string} label
	 * @param {import("../../modules/addonmanager").default} manager
	 * @returns
	 */
	buildAddonMenu(type: "plugin" | "theme", label: string, manager: AddonManager) {
		const addons = manager.addonList.sort((a, b) => {
			a = a.name || a.getName();
			b = b.name || b.getName();
			a.toLowerCase().localeCompare(b.toLowerCase());
		});
		const toggles = addons.map(addon => {
			const name = addon.name || addon.getName();
			const hasSettings = (addon as Plugin).instance && typeof (addon as Plugin).instance.getSettingsPanel === "function";
			const isEnabled = manager.isEnabled(name);
			const isPartial = manager.getAddon(name)?.partial ?? false;
			return {
				type: "submenu",
				label: name,
				color: !isEnabled || isPartial ? "danger" : "default",
				items: [
					{
						type: "toggle",
						label: isEnabled ? "Enabled" : "Disabled",
						disabled: isPartial,
						active: isEnabled,
						action: e => {
							manager.toggleAddon(name);
						}
					},
					hasSettings && {
						label: t("Addons.addonSettings"),
						icon: SettingsIcon,
						action: () => {
							const getSettings = addon.instance.getSettingsPanel.bind(addon.instance);
							Modals.showAddonSettingsModal(name, getSettings());
						}
					},
					{
						label: t("Addons.editAddon"),
						icon: PencilIcon,
						action: () => {
							manager.editAddon(addon);
						}
					},
					{ type: "separator" },
					{
						label: t("Addons.deleteAddon"),
						color: "danger",
						icon: Trash2Icon,
						action: async () => {
							const shouldDelete = await confirmDelete(addon);
							if (!shouldDelete) return;
							manager?.deleteAddon?.(addon);
						}
					}
				].filter(Boolean)
			};
		});

		toggles.push(...[
			{ type: "separator" },
			{
				label: t("Addons.openFolder", { context: manager.prefix }),
				action: () => ipc.openPath(manager.addonFolder)
			},
			{
				label: t("Addons.enableAll"),
				action() {
					confirmEnable(manager.enableAllAddons.bind(manager), manager.prefix);
				}
			},
			{
				label: t("Addons.disableAll"),
				action: () => manager.disableAllAddons()
			}])
		// If the store is enabled, add a separate item to open it
		if (SettingsStore.get("settings", "store", "bdAddonStore")) {
			if (toggles.length) toggles.push({ type: "separator" }); // Add separator when addons exist

			toggles.push({
				label: t("Addons.openStore", { context: type }),
				action: () => {
					this.openCategory(manager.prefix + "s");
					// If the addon store instantly opens have it just stop basically
					DOMManager.onAdded(":where(.bd-store-card, .bd-addon-title > :nth-child(3))", elem => (elem as HTMLElement)?.click());
				}
			});
		}

		return {
			type: "submenu",
			label: label,
			action: () => this.openCategory(manager.prefix + "s"),
			items: toggles
		};
	}

	async openCategory(id: string) {
		ContextMenu.close();
		settings.openSettingsPage(id);
	}
})();

import Changelog from "@data/changelog";

import React from "@modules/react";
import DiscordModules from "@modules/discordmodules";

import HistoryIcon from "@ui/icons/history";

import Modals from "@ui/modals";


export default class SettingsTitle extends React.Component {
    renderHeader() {
        return <h2 className="bd-sidebar-header-label">BetterDiscord</h2>;
    }

    render() {
        return <div className="bd-sidebar-header">
                    {this.renderHeader()}
                    <DiscordModules.Tooltip color="primary" position="top" text="Changelog">
                        {props =>
                            <div {...props} className="bd-changelog-button" onClick={() => Modals.showChangelogModal(Changelog)}>
                                <HistoryIcon className="bd-icon" size="16px" />
                            </div>
                        }
                    </DiscordModules.Tooltip>
                </div>;
    }
}
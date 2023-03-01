import {Changelog} from "data";
import {DiscordModules, React} from "modules";
import HistoryIcon from "../icons/history";
import Modals from "../modals";

<<<<<<< HEAD
const Tooltip = WebpackModules.getByPrototypes("renderTooltip");
if(!SidebarComponents) debugger;
=======

>>>>>>> d1183633c0e4411c929cb4f9ec6f9745d8a7ee32
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

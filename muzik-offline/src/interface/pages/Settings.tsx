import { motion } from 'framer-motion';
import { FunctionComponent, useState, useEffect } from 'react';
import "@styles/pages/Settings.scss";
import { ChevronDown, ComponentIcon, InformationCircleContained, Layout, Lock, SettingsIcon } from "@icons/index";
import { SettingsNavigator } from '@components/index';
import { selectedSettingENUM } from 'types';
import { AppearanceSettings, GeneralSettings } from '@layouts/index';

type SettingsProps = {
    openSettings: boolean;
    closeSettings: () => void;
}

const variants={
    open: {bottom: "-10vh"},
    closed: {bottom: "-110vh"},
}

const Settings: FunctionComponent<SettingsProps> = (props: SettingsProps) => {

    const [selectedSetting, setSelectedSetting] = useState<selectedSettingENUM>(selectedSettingENUM.General);

    function convertToEnum(arg: string){
        if(arg == "General")return selectedSettingENUM.General;
        else if(arg == "Appearance")return selectedSettingENUM.Appearance;
        else if(arg == "Security")return selectedSettingENUM.Security;
        else if(arg == "Advanced")return selectedSettingENUM.Advanced;
        else if(arg == "About")return selectedSettingENUM.About;
        else return selectedSettingENUM.General;
    }

    function setSelectedSettingF(arg: string){setSelectedSetting(convertToEnum(arg));}
    
    useEffect(() => {
        if(!props.openSettings)setSelectedSetting(selectedSettingENUM.General);

    }, [props.openSettings])
    

    return (
        <motion.div className="settings_section"
            animate={props.openSettings ? "open" : "closed"}
            variants={variants}
            transition={{ type: "spring", stiffness: 100, damping: 14 }}
            >
            <div className="settings_navigator">
                <div className="title">
                    <motion.div whileTap={{scale: 0.98}} onClick={props.closeSettings}>
                        <ChevronDown />
                    </motion.div>
                    <h1>Settings</h1>
                </div>
                <SettingsNavigator icon={SettingsIcon} title={selectedSettingENUM.General} selected_setting={selectedSetting} setSelectedSettingF={setSelectedSettingF}/>
                <SettingsNavigator icon={Layout} title={selectedSettingENUM.Appearance} selected_setting={selectedSetting} setSelectedSettingF={setSelectedSettingF}/>
                <SettingsNavigator icon={Lock} title={selectedSettingENUM.Security} selected_setting={selectedSetting} setSelectedSettingF={setSelectedSettingF}/>
                <SettingsNavigator icon={ComponentIcon} title={selectedSettingENUM.Advanced} selected_setting={selectedSetting} setSelectedSettingF={setSelectedSettingF}/>
                <SettingsNavigator icon={InformationCircleContained} title={selectedSettingENUM.About} selected_setting={selectedSetting} setSelectedSettingF={setSelectedSettingF}/>
            </div>
            <div className="settings_panel">
                {
                    (
                    () => {
                        switch(selectedSetting){
                            case selectedSettingENUM.General:
                                return <GeneralSettings />
                            case selectedSettingENUM.Appearance:
                                return <AppearanceSettings />
                            case selectedSettingENUM.Security:
                                return <div />
                            case selectedSettingENUM.Advanced:
                                return <div />
                            case selectedSettingENUM.About:
                                return <div />
                            default:
                                return <div />
                        }
                    }
                    )()
                }
            </div>
        </motion.div>
    )
}

export default Settings
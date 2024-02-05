import * as React from 'react';
import {useTheme} from '@mui/material/styles';
import SwipeableViews from 'react-swipeable-views';
import AppBar from '@mui/material/AppBar';
import Container from '@mui/material/Container';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Send from '@mui/icons-material/Send';
import Download from '@mui/icons-material/Download';
import Settings from '@mui/icons-material/Settings';
import Info from '@mui/icons-material/Info';
import Stack from '@mui/material/Stack';
import Logo from './assets/react.svg'
import FileUpload from './file_upload'
import { FileProps } from './file_upload/index.types';

interface TabPanelProps {
    children?: React.ReactNode;
    dir?: string;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const {children, value, index, ...other} = props;
    return (
        <Box
            role="tabpanel"
            hidden={value !== index}
            id={`full-width-tabpanel-${index}`}
            aria-labelledby={`full-width-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{p: 3}}>
                    {children}
                </Box>
            )}
        </Box>
    );
}

function Layout() {
    const theme = useTheme();
    const [value, setValue] = React.useState(0);

    const [_, setFilesToUpload] = React.useState<FileProps[]>([])

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const handleChangeIndex = (index: number) => {
        setValue(index);
    };

    const handleFilesChange = (files: FileProps[]) => {
        // Update chosen files
        setFilesToUpload([ ...files ])
    };

    return (
        <Box sx={{flexGrow: 1, my: 0, bgcolor: 'background.paper'}}>
            <Stack spacing={2}>
                <img src={Logo} className="logo" alt="Logo"/>
                <Box sx={{my: 0, bgcolor: 'background.paper'}}>
                    <AppBar position="static">
                        <Tabs
                            value={value}
                            onChange={handleChange}
                            indicatorColor="secondary"
                            textColor="inherit"
                            variant="fullWidth"
                        >
                            <Tab icon={<Send/>} iconPosition="start" label="send"/>
                            <Tab icon={<Download/>} iconPosition="start" label="receive"/>
                            <Tab icon={<Settings/>} iconPosition="start" label="settings"/>
                            <Tab icon={<Info/>} iconPosition="start" label="about"/>
                        </Tabs>
                    </AppBar>
                    <SwipeableViews
                        axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
                        index={value}
                        onChangeIndex={handleChangeIndex}
                    >
                        <TabPanel value={value} index={0} dir={theme.direction}>
                            <FileUpload
                                multiFile={true}
                                onFilesChange={handleFilesChange}
                                onContextReady={(_) => { }}
                            />
                        </TabPanel>
                        <TabPanel value={value} index={1} dir={theme.direction}>
                            Item Two

                        </TabPanel>
                        <TabPanel value={value} index={2} dir={theme.direction}>
                            Item Three
                        </TabPanel>
                    </SwipeableViews>
                </Box>
            </Stack>
        </Box>
    );
}

export default function App() {
    return (
        <Container sx={{paddingLeft: 0, paddingRight: 0}}>
            <Layout/>
        </Container>
    );
}
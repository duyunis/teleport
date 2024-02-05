import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import { useTheme } from '@mui/material/styles'
import { Typography, Avatar, IconButton, Box } from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import FolderZipIcon from '@mui/icons-material/FolderZip'
import ImageIcon from '@mui/icons-material/Image'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import InsertDriveFile from '@mui/icons-material/InsertDriveFile'
import FolderIcon from '@mui/icons-material/Folder'
import { FileAttachmentProps } from "./index.types.ts"
import LinearProgress from '@mui/material/LinearProgress'

function FileAttachment(props: FileAttachmentProps) {
    const {
        size,
        file,
        index,
        disabled,
        handleRemoveFile,
        startSend,
        sendDone,
    } = props

    const theme = useTheme()

    const avatarRef = useRef<HTMLDivElement | null>(null)

    let icon: React.ReactNode =
        <InsertDriveFile color="primary" fontSize="large" />

    // Set icon for directory files
    if (file.is_dir) {
        icon = <FolderIcon color="primary" fontSize="large" />
    }

    // Set icon for compressed files
    if (/\.(g?zip|tar|gz|rar)$/i.test(file.name)) {
        icon = <FolderZipIcon color="primary" fontSize="large" />
    }

    // Set icon for image files
    if (/\.(jpg|jpeg|png|gif|bmp|tiff)$/i.test(file.name)) {
        icon = <ImageIcon color="primary" fontSize="large" />
    }

    // Set icon for media files
    if (/\.(mp.|midi|mkv|avi)$/i.test(file.name)) {
        icon = <PlayCircleOutlineIcon color="primary" fontSize="large" />
    }

    return (
        <>
            <Box
                sx={{
                    mb: 0,
                    display: 'flex',
                    alignItems: 'center',
                    '&:nth-of-type(even)': {
                        backgroundColor: theme.palette.action.hover
                    }
                }}
            >
                <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center' }}>
                    <Avatar
                        alt=""
                        src={file.path}
                        ref={avatarRef}
                        variant="rounded"
                        sx={{
                            m: .5,
                            width: 32,
                            height: 32,
                            display: 'flex',
                            background: 'transparent'
                        }}
                    >
                        {icon}
                    </Avatar>
                    <Typography
                        component="div"
                        sx={{ display: 'inline-grid', alignItems: 'center', width: '100%' }}
                    >
                        <Typography variant="body2" noWrap>
                            {file.name}
                        </Typography>
                        <Typography variant="caption" noWrap>
                            <React.Fragment>
                                <b>{size}</b> | <b>{file?.extension ? file.extension.toLowerCase() : file?.is_dir ? 'directory' : ''}</b>
                            </React.Fragment>
                        </Typography>
                        {startSend && !sendDone &&
                            <Typography variant="caption" noWrap>
                                <LinearProgress variant="determinate" value={file?.progress} />
                            </Typography>
                        }
                    </Typography>
                </Box>

                <Typography component="div" sx={{ mr: -.5, textAlign: 'right' }}>
                    {!startSend && !sendDone &&
                        <IconButton
                            disabled={disabled}
                            onClick={(event): void => handleRemoveFile(event, index)}
                        >
                            <CloseIcon />
                        </IconButton>
                    }
                    {sendDone &&
                        <CheckCircleIcon color="primary" />
                    }
                </Typography>
            </Box>
        </>
    )
}

FileAttachment.propTypes = {
    size: PropTypes.string,
    file: PropTypes.object,
    disabled: PropTypes.bool,
    index: PropTypes.number.isRequired,
    handleRemoveFile: PropTypes.func.isRequired,
    startSend: PropTypes.bool,
    sendDone: PropTypes.bool,
}

export default FileAttachment
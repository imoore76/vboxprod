/**
 * Return the correct icon string relative to images/vbox/ for the guest OS type
 * @param {String} osTypeId - guest OS type id
 * @return {String} icon file name
 */
function vboxGuestOSTypeIcon(osTypeId) {
	
    var strIcon = "os_other.png";
    switch (osTypeId)
    {
        case "Other":           strIcon = "os_other.png"; break;
        case "DOS":             strIcon = "os_dos.png"; break;
        case "Netware":         strIcon = "os_netware.png"; break;
        case "L4":              strIcon = "os_l4.png"; break;
        case "Windows31":       strIcon = "os_win31.png"; break;
        case "Windows95":       strIcon = "os_win95.png"; break;
        case "Windows98":       strIcon = "os_win98.png"; break;
        case "WindowsMe":       strIcon = "os_winme.png"; break;
        case "WindowsNT4":      strIcon = "os_winnt4.png"; break;
        case "Windows2000":     strIcon = "os_win2k.png"; break;
        case "WindowsXP":       strIcon = "os_winxp.png"; break;
        case "WindowsXP_64":    strIcon = "os_winxp_64.png"; break;
        case "Windows2003":     strIcon = "os_win2k3.png"; break;
        case "Windows2003_64":  strIcon = "os_win2k3_64.png"; break;
        case "WindowsVista":    strIcon = "os_winvista.png"; break;
        case "WindowsVista_64": strIcon = "os_winvista_64.png"; break;
        case "Windows2008":     strIcon = "os_win2k8.png"; break;
        case "Windows2008_64":  strIcon = "os_win2k8_64.png"; break;
        case "Windows7":        strIcon = "os_win7.png"; break;
        case "Windows7_64":     strIcon = "os_win7_64.png"; break;
        case "Windows81":
        case "Windows8":        strIcon = "os_win8.png"; break;
        case "Windows81_64":
        case "Windows8_64":     strIcon = "os_win8_64.png"; break;
        case "WindowsNT":       strIcon = "os_win_other.png"; break;
        case "Windows2012_64":	strIcon = "os_win2k12_64.png"; break;
        case "OS2Warp3":        strIcon = "os_os2warp3.png"; break;
        case "OS2Warp4":        strIcon = "os_os2warp4.png"; break;
        case "OS2Warp45":       strIcon = "os_os2warp45.png"; break;
        case "OS2eCS":          strIcon = "os_os2ecs.png"; break;
        case "OS2":             strIcon = "os_os2_other.png"; break;
        case "Linux22":         strIcon = "os_linux22.png"; break;
        case "Linux24":         strIcon = "os_linux24.png"; break;
        case "Linux24_64":      strIcon = "os_linux24_64.png"; break;
        case "Linux26":         strIcon = "os_linux26.png"; break;
        case "Linux26_64":      strIcon = "os_linux26_64.png"; break;
        case "ArchLinux":       strIcon = "os_archlinux.png"; break;
        case "ArchLinux_64":    strIcon = "os_archlinux_64.png"; break;
        case "Debian":          strIcon = "os_debian.png"; break;
        case "Debian_64":       strIcon = "os_debian_64.png"; break;
        case "OpenSUSE":        strIcon = "os_opensuse.png"; break;
        case "OpenSUSE_64":     strIcon = "os_opensuse_64.png"; break;
        case "Fedora":          strIcon = "os_fedora.png"; break;
        case "Fedora_64":       strIcon = "os_fedora_64.png"; break;
        case "Gentoo":          strIcon = "os_gentoo.png"; break;
        case "Gentoo_64":       strIcon = "os_gentoo_64.png"; break;
        case "Mandriva":        strIcon = "os_mandriva.png"; break;
        case "Mandriva_64":     strIcon = "os_mandriva_64.png"; break;
        case "RedHat":          strIcon = "os_redhat.png"; break;
        case "RedHat_64":       strIcon = "os_redhat_64.png"; break;
        case "Turbolinux":      strIcon = "os_turbolinux.png"; break;
        case "Ubuntu":          strIcon = "os_ubuntu.png"; break;
        case "Ubuntu_64":       strIcon = "os_ubuntu_64.png"; break;
        case "Xandros":         strIcon = "os_xandros.png"; break;
        case "Xandros_64":      strIcon = "os_xandros_64.png"; break;
        case "Linux":           strIcon = "os_linux_other.png"; break;
        case "FreeBSD":         strIcon = "os_freebsd.png"; break;
        case "FreeBSD_64":      strIcon = "os_freebsd_64.png"; break;
        case "OpenBSD":         strIcon = "os_openbsd.png"; break;
        case "OpenBSD_64":      strIcon = "os_openbsd_64.png"; break;
        case "NetBSD":          strIcon = "os_netbsd.png"; break;
        case "NetBSD_64":       strIcon = "os_netbsd_64.png"; break;
        case "Solaris":         strIcon = "os_solaris.png"; break;
        case "Solaris_64":      strIcon = "os_solaris_64.png"; break;
        case "Solaris11_64":      strIcon = "os_oraclesolaris_64.png"; break;
        case "OpenSolaris":     strIcon = "os_oraclesolaris.png"; break;
        case "OpenSolaris_64":  strIcon = "os_oraclesolaris_64.png"; break;
        case "QNX":             strIcon = "os_qnx.png"; break;
        case 'MacOS':			strIcon = "os_macosx.png"; break;
        case 'MacOS_64':			strIcon = "os_macosx_64.png"; break;
        case 'Oracle':			strIcon = "os_oracle.png"; break;
        case 'Oracle_64':			strIcon = "os_oracle_64.png"; break;
        case 'JRockitVE':		strIcon = 'os_jrockitve.png'; break;
        case "VirtualBox_Host":	strIcon = "os_virtualbox.png"; break;

        default:
            break;
    }
    return strIcon;
}

